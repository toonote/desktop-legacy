<style scoped>
.sidebar{
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	color:#585858;
	font-family: "PingFang SC";
	min-height:100%;
	width:250px;
}
.wrapper{
	line-height: 24px;
	padding-top: 10px;
}
.wrapper h2{
	font-size:12px;
	padding-left:15px;
	font-weight: normal;
}
.wrapper ul{
	list-style: none;
}
.wrapper li{
	font-size:13px;
	padding-left:25px;
	/*cursor:pointer;*/
}
.wrapper li.active{
	background: #CECECE;
}
.wrapper li.note::before{
	padding-right:3px;
	background-image:url(../images/icon-file.png);
}
.wrapper li.folder::before{
	padding-right:3px;
	background-image:url(../images/icon-folder.png);
}
</style>

<template>
<section class="sidebar">
	<section class="wrapper" v-for="notebook in notes">
		<h2>{{notebook.title}}</h2>
		<ul>
			<li class="icon note" v-bind:class="{active:note.id == currentNote.id}" v-for="note in notebook.notes">{{note.title}}</li>
		</ul>
	</section>
</section>
</template>


<script>
export default {
	events:{
		metaUpdate:function(data){
			this.notes = data.notebook;
		},
		currentNoteUpdate:function(note){
			this.currentNote = note;
		}
	},
	data(){
		var data = {notes:[],currentNote:{}};
		return data;
	}
};
</script>
