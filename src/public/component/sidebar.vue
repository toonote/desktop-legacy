<style scoped>
.sidebar{
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	color:#585858;
	font-family: "PingFang SC";
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
	<section class="wrapper">
		<h2>最近</h2>
		<ul>
			<li class="icon note">TooNote 2016展望</li>
			<li class="icon note">你好，这里是调频FM365</li>
			<li class="icon folder">hello@263.net</li>
		</ul>
	</section>
	<section class="wrapper">
		<h2>最近</h2>
		<ul>
			<li class="icon note">TooNote 2016展望</li>
			<li class="icon note">你好，这里是调频FM365</li>
			<li class="icon folder">hello@263.net</li>
		</ul>
	</section>
</section>
</template>


<script>
export default {
	data(){
		return {
			msg: 'I am TooNote.'
		};
	}
};
</script>
