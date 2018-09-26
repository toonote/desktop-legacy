<template>
<section class="task">
	<div class="taskDetail">
		<div class="title">同步中</div>
		<div class="detailWrapper">
			<p><label>状态</label><span>运行中</span></p>
			<p><label>优先级</label><span>高</span></p>
		</div>
		<div class="taskLog">
			<p><span class="date">14:04</span>任务被添加任务被添加任务被添加任务被添加</p>
			<p><span class="date">14:04</span>任务被添加</p>
			<p><span class="date">14:04</span>任务被添加</p>
			<p><span class="date">14:04</span>任务被添加</p>
		</div>
	</div>
	<div class="taskWrapper">
		<div class="taskItem doing"></div>
		<div class="taskItem failed"></div>
		<div class="taskItem"></div>
		<div class="taskItem"></div>
		<div class="taskItem failed"></div>
		<div
			v-for="task in taskList.data"
			class="taskItem"
			:class="{doing:task.status === 2}"
			:key="task.id"
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

export default {
	computed: {
	},
	watch: {
	},
	methods: {
		doLogin(){
			user.login();
		}
	},
	data(){
		return {
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
	text-indent: -40px;
	margin-left: 40px;
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
