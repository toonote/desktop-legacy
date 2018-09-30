<template>
<section class="task">
	<div class="taskDetail" v-if="currentTask && isCurrentTaskLive">
		<div class="title">{{getName(currentTask.type)}}</div>
		<div class="detailWrapper">
			<p><label>状态</label><span>{{getStatus(currentTask.status)}}</span></p>
			<p><label>优先级</label><span>{{getPriority(currentTask.priority)}}</span></p>
			<p><label>计划时间</label><span>{{formatDate(currentTask.runAt)}}({{countDown(currentTask.runAt)}})</span></p>
		</div>
		<div class="taskLog">
			<p v-for="(log, $index) in currentTask.log" :key="$index">{{log}}</p>
			<!-- <p><span class="date">14:04</span>任务被添加任务被添加任务被添加任务被添加</p>
			<p><span class="date">14:04</span>任务被添加</p>
			<p><span class="date">14:04</span>任务被添加</p> -->
		</div>
	</div>
	<div class="taskWrapper">
		<!-- <div class="taskItem doing"></div>
		<div class="taskItem failed"></div>
		<div class="taskItem"></div>
		<div class="taskItem"></div>
		<div class="taskItem failed"></div> -->
		<div
			v-for="task in taskList.data"
			class="taskItem"
			:class="{doing:task.status === 2, failed:task.status === 3}"
			:key="task.id"
			@click="toggleCurrentTask(task)"
		></div>
	</div>
	<!-- <ul>
		<li
			v-for="task in taskList.data"
			:key = "task.id"
		><pre>{{JSON.stringify(task,null,2)}}</pre></li>
	</ul> -->
</section>
</template>


<script>
import {taskRenderData} from '../modules/task';
import {MAP as TASK_MAP} from '../modules/task/TASK';

export default {
	computed: {
		// 是否显示当前任务的窗口
		isCurrentTaskLive(){
			return this.taskList.data.indexOf(this.currentTask) > -1;
		},
	},
	watch: {
	},
	methods: {
		doLogin(){
			user.login();
		},
		getName(type){
			// console.log(type, TASK_MAP);
			const taskType = TASK_MAP[type];
			if(!taskType) return '未知任务';
			return taskType.text;
		},
		getStatus(status){
			const statusMap = {
				1: '队列中',
				2: '正在运行',
				3: '已失败'
			};
			return statusMap[status] || '未知';
		},
		getPriority(priority){
			const priorityMap = {
				0: '紧急(同步)',
				1: '极高(异步)',
				2: '高(1分钟)',
				3: '较高(5分钟)',
				4: '中(30分钟)',
				5: '较低(1天)',
				6: '低(1周)',
				7: '极低',
			};
			return priorityMap[priority] || '未知';
		},
		formatDate(date){
			let ts = date.getTime() - date.getTimezoneOffset()*60*1000;
			let s = new Date(ts).toISOString();

			// s.replace(/T.+$/,'');	// 2015-11-24
			// s.replace(/\-\d+T.+$/,''); // 2015-11
			// s.replace(/(^\d+\-|T.+$)/g,''); // 11-24
			return s.replace(/(^[0-9\-]+T|\.\d+Z$)/g,''); // 14:16:18
			// s.replace(/(^[0-9\-]+T|:\d+\.\d+Z$)/g,''); // 14:16
			// s.replace(/T/g,' ').replace(/\.\d+Z$/,''); // 2015-11-24 14:16:18
			// s.replace(/T/g,' ').replace(/:\d+\.\d+Z$/,''); // 2015-11-24 14:16
			// return s.replace(/T/g,' ').replace(/^\d+\-/, '').replace(/:\d+\.\d+Z$/,''); // 11-24 14:16

		},
		countDown(date){
			// console.log(date, date.getTime(), this.now);
			let timeout = Math.floor((date.getTime() - this.now)/1000);
			if(timeout < 0) timeout = 0;
			return timeout;
		},
		// 切换当前任务显示状态
		toggleCurrentTask(task){
			if(this.currentTask === task){
				clearInterval(this.timer);
				this.currentTask = null;
				this.timer = 0;
				return;
			}
			if(!this.timer){
				this.timer = setInterval(() => {
					this.now = Date.now();
				}, 100);
			}
			this.currentTask = task;
		}
	},
	data(){
		return {
			currentTask: null,
			taskList: taskRenderData,
			// 更新任务倒计时的timer
			timer: null,
			now: Date.now(),
		};
	},
	mounted(){
		// user.init();
	}

};
</script>

<style scoped>
/* .task{
	position: absolute;
	bottom: 0;
	color:red;
	font-size:9px;
	border: 1px solid #eee;
	background: rgba(255,255,255,.7);
	z-index: 2;
	pointer-events: none;
} */

@keyframes doing {
	0%{
		opacity: .3;
	}
	50%{
		opacity: 1;
	}
	100%{
		opacity: .3;
	}
}
.task{
	position: absolute;
	left: 0;
	bottom: 0;
}
.task .taskDetail{
	width: 230px;
    padding: 15px;
    font-size: 12px;
    background: white;
    box-sizing: border-box;
    box-shadow: 0 5px 15px rgba(0,0,0,.1);
    margin: 0 10px;
}
.task .taskDetail .title{
	font-size: 14px;
    font-weight: bold;
	margin-bottom: 10px;
}
.task .taskDetail .detailWrapper{
	margin-bottom: 10px;
}
.task .taskDetail .detailWrapper label{
	display: inline-block;
	width: 80px;
}
.task .taskDetail .taskLog{
	background:#333;
	color: white;
	border-radius: 2px;
	padding: 10px;
	max-height: 300px;
	overflow: auto;
}
.task .taskDetail .taskLog p{
	/* 有date时保留 */
	/* text-indent: -40px; */
	/* margin-left: 40px; */
}
.task .taskDetail .taskLog .date{
	color:#999;
	padding: 0 5px;
}
.task .taskWrapper{
	padding: 10px;
	line-height: 8px;
}
.task .taskWrapper .taskItem{
	width: 8px;
	height: 8px;
	margin-right: 8px;
	border-radius: 100%;
	background: #718c00;
	display: inline-block;
	cursor: pointer;
}
.task .taskWrapper .taskItem.doing{
	animation: doing 1s infinite;
}
.task .taskWrapper .taskItem.failed{
	background: #c00;
}

</style>
