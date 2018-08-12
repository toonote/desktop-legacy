<template>
<section class="task">
	<ul>
		<li
			v-for="task in taskList.data"
			:key = "task.id"
		><pre>{{JSON.stringify(task,null,2)}}</pre></li>
	</ul>
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
.task{
	position: absolute;
	bottom: 0;
	color:red;
	font-size:9px;
	border: 1px solid #eee;
	background: rgba(255,255,255,.7);
	z-index: 2;
	pointer-events: none;
}
</style>
