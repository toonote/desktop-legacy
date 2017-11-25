<style scoped>
.notebookSelect{
	position: absolute;
	z-index: 2;
	width: 800px;
	height: 450px;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	background:white;
	border:5px solid #bbb;
	color:#585858;
	font-family: "PingFang SC";
	display: flex;
}
</style>

<template>
<section tabindex="1" class="mask">
<section class="notebookSelect" v-on:click.stop>
	<ul>
		<li
			class="nootbook"
			v-for="notebook in notebookList"
			:key="notebook.id"
			@click="switchCurrentNotebook(notebook.id)"
		>{{notebook.title}}</li>
	</ul>
</section>
</section>
</template>


<script>
import {uiData} from '../modules/controller';

export default {
	data(){
		return uiData
	},
	computed: {
	},
	watch: {
	},
	methods: {

	}
};
</script>
