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
	margin-left: 20px;
	margin-right: 20px;
	padding-top: 160px;
	width: 140px;
	height: 200px;
	background: linear-gradient(to bottom, #728B18, #728B18) no-repeat;
	background-size: 100% 140px;
	border-radius: 5px;
	box-shadow: 0 0 8px rgba(0,0,0,.2);
	text-shadow: 0 0 2px rgba(0,0,0,0.2);
	color: #333;
	overflow: hidden;
	white-space: nowrap;
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
.notebookSelect ul > li.createNotebook.placeholder{
	background: linear-gradient(to bottom, #999, #999) no-repeat;
	background-size: 100% 140px;
}
.notebookSelect ul > li.createNotebook.creating{

}
.notebookSelect ul > li.createNotebook.placeholder::after{
	content: '+';
	background: none;
	font-size: 100px;
    line-height: 120px;
    color: #CCC;
    /* text-shadow: 0 0 1px rgba(0,0,0,.3); */
}
.notebookSelect ul > li.notebookList-enter-active,
.notebookSelect ul > li.notebookList-leave-active{
	transition: all .4s ease-in-out;
}
.notebookSelect ul > li.notebookList-enter,
.notebookSelect ul > li.notebookList-leave-to{
	opacity: 0;
	width: 0;
	margin: 0;
}
.notebookSelect ul > li.notebookList-enter-to,
.notebookSelect ul > li.notebookList-leave{
	opacity: 1;
}

.notebookTitleInput{
	display: block;
	margin: 0 auto;
	width: 110px;
}
</style>

<template>
<section class="notebookSelect" v-on:click.stop v-if="!currentNotebook.data.id">
	<transition-group name="notebookList" tag="ul">
		<li
			class="nootbook"
			v-for="notebook in notebookList.data"
			v-show="!newNotebook.isCreating"
			:key="notebook.id"
			@click="switchCurrentNotebook(notebook.id)"
		>{{notebook.title}}</li>
		<li
			class="nootbook createNotebook"
			:class="{creating:newNotebook.isCreating, placeholder:!newNotebook.isCreating}"
			:key="'newNotebook'"
			@click="enterCreateNotebook()"
		>
			<span v-show="!newNotebook.isCreating">新建笔记本</span>
			<input
				class="titleInput notebookTitleInput"
				v-focus-input
				v-show="newNotebook.isCreating"
				placeholder="新建笔记本"
				@keydown.enter="createNotebook($event.target.value)"
				@keydown.esc="newNotebook.isCreating=false"
				@click.stop
			/>
		</li>
	</transition-group>
</section>
</template>


<script>
import {
	uiData,
	switchCurrentNotebook,
	createNotebook,
	recoverLastState
} from '../modules/controller';

export default {
	data(){
		return {
			...uiData,
			newNotebook: {
				isCreating: false
			}
		};
	},
	computed: {
	},
	watch: {
	},
	methods: {
		switchCurrentNotebook(notebookId){
			switchCurrentNotebook(notebookId);
		},
		enterCreateNotebook(){
			this.newNotebook.isCreating = true;
		},
		createNotebook(title){
			createNotebook(title);
			this.newNotebook.isCreating = false;
		}
	},
	mounted(){
		recoverLastState();
	}
};
</script>
