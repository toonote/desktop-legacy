<template>
<section class="task">
	<div class="taskDetail" v-if="currentTask">
		<div class="title">{{getName(currentTask.type)}}</div>
		<div class="detailWrapper">
			<p><label>状态</label><span>{{getStatus(currentTask.status)}}</span></p>
			<p><label>优先级</label><span>{{getPriority(currentTask.priority)}}</span></p>
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
			:class="{doing:task.status === 2}"
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
import TASKS from '../modules/task/TASKS';

export default {
	computed: {
	},
	watch: {
	},
	methods: {
		doLogin(){
			user.login();
		},
		getName(type){
			const taskType = TASKS[type];
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
		// 切换当前任务显示状态
		toggleCurrentTask(task){
			if(this.currentTask === task){
				this.currentTask = null;
				return;
			}
			this.currentTask = task;
		}
	},
	data(){
		return {
			currentTask: null,
			taskList: taskRenderData
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
