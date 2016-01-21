<style scoped>
.menubar{
	font-family: "PingFang SC";
	height:24px;
	font-size:13px;
	line-height: 24px;
	background:linear-gradient(top,#EEE,#CCC);
}
.menubar ul{
	padding:0 20px;
	list-style: none;
}
.menubar ul li{
	display: inline-block;
	padding:0 5px;
	margin-right:10px;
}
.menubar ul li.active{
	background:rgb(40,141,248);
	color: white;
}
</style>

<template>
<section class="menubar">
	<ul>
		<li class="active">TooNote</li>
		<li>File</li>
		<li>Edit</li>
	</ul>
</section>
</template>


<script>
import Menu from '../api/menu/index';
let menu = new Menu();
export default {
	events:{
	},
	data(){
		let data = {
			isShow:menu.isVue,
			menuList:[{
				title:'TooNote',
				subMenu:[{
					title:'About'
				}]
			}]
		};
		return data;
	},
	ready(){
		this.$nextTick(()=>{
			this.$dispatch('toggleMenubar', menu.isVue);
		});
	}
};
</script>
