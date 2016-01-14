<style scoped>
.preview{
	font-family: "PingFang SC";
	min-height:100%;
	flex:1;
}
</style>

<template>
<section class="preview">
	{{content}}
</section>
</template>


<script>
export default {
	// props:['content'],
	events:{
		sourceChange:function(content){
			this.content = content;
		}
	},
	data(){
		var data = {
			content:''
		};
		return data;
	}
};
</script>
