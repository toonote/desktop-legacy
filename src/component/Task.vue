<template>
<section class="task">
	<div class="taskWrapper">
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
}
.task .taskWrapper .taskItem.doing{
	animation: doing 1s infinite;
}

</style>
