<style scoped>
.notebookSelect{
	position: absolute;
	z-index: 99;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: #f0f0f0;
	font-family: "PingFang SC";
}
.notebookSelect ul{
	display: flex;
	align-items: center;
	width: 100%;
	height: 100%;
	justify-content: center;
	box-sizing: border-box;
	list-style: none;
}
.notebookSelect ul > li{
	position: relative;
	cursor: pointer;
	box-sizing: border-box;
	text-align: center;
	padding-top: 160px;
	width: 140px;
	height: 200px;
	background: linear-gradient(to bottom, #728B18, #728B18) no-repeat;
	background-size: 100% 140px;
	border-radius: 5px;
	box-shadow: 0 0 8px rgba(0,0,0,.2);
	text-shadow: 0 0 2px rgba(0,0,0,0.2);
	color: #333;
	transition: box-shadow .4s;
}
.notebookSelect ul > li:hover{
	box-shadow: 0 0 15px rgba(0,0,0,.3);
}
.notebookSelect ul > li::after{
	content: ' ';
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 140px;
	background: url(../images/notebook-logo.png) no-repeat;
	background-position: center center;
	background-size: 70px 70px;
}
</style>

<template>
<section class="notebookSelect" v-on:click.stop v-if="!currentNotebook.data.id">
	<ul>
		<li
			class="nootbook"
			v-for="notebook in notebookList.data"
			:key="notebook.id"
			@click="switchCurrentNotebook(notebook.id)"
		>{{notebook.title}}</li>
	</ul>
</section>
</template>


<script>
import {uiData, switchCurrentNotebook} from '../modules/controller';

export default {
	data(){
		return uiData
	},
	computed: {
	},
	watch: {
	},
	methods: {
		switchCurrentNotebook(notebookId){
			switchCurrentNotebook(notebookId);
		}
	}
};
</script>
