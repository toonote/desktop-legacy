<style scoped>
.menubar{
	font-family: "PingFang SC";
	height:24px;
	font-size:13px;
	line-height: 24px;
	background:linear-gradient(top,#EEE,#CCC);
	cursor: default;
}
.menubar.hidden{
	display: none;
}
.menubar ul{
	padding:0 20px;
	list-style: none;
}
.menubar ul li{
	display: inline-block;
	margin-right:10px;
}
.menubar ul li.active{
	background:rgb(40,141,248);
	color: white;
}
.menubar ul li span{
	padding:0 5px;
}
.menubar ul > li > ul{
	position: absolute;
	background:#D6D6D6;
	color:#333;
	opacity: .9;
	display: none;
	box-shadow:0 3px 3px rgba(192,192,192,.5);
	padding:0;
	border:1px solid #ccc;
}
.menubar ul > li.active > ul{
	display: block;
}
.menubar ul > li > ul > li{
	margin:0;
}
.menubar ul > li > ul > li:hover{
	color:white;
	background:rgb(40,141,248);
}
.menubar ul > li > ul > li > span{
	padding:0 20px;
}
</style>

<template>
<section class="menubar">
	<ul>
		<li v-for="menu in menuList" v-bind:class="{active:menu.isActive}" v-on:click="menuClick(menu.title)">
			<span>{{menu.title}}</span>
			<ul v-if="menu.subMenu && menu.subMenu.length">
				<li v-for="subMenu in menu.subMenu" v-on:click="subMenuClick(subMenu.event)"><span>{{subMenu.title}}</span></li>
			</ul>
		</li>
	</ul>
</section>
</template>


<script>
import Menu from '../api/menu/index';
import util from '../modules/util';
let menu = new Menu(util.platform);
export default {
	methods:{
		menuClick(title){
			this.menuList.forEach(function(menu){
				if(menu.title === title){
					menu.isActive = !menu.isActive;
				}else{
					menu.isActive = false;
				}
			});
			// 触发vue更新
			// this.menuList = this.menuList.concat([]);
		},
		subMenuClick(event){
			menu.onClick(event);
		}
	},
	data(){
		let data = {
			isShow:menu.isVue,
			menuList:[{
				title:'TooNote',
				isActive:false,
				subMenu:[]
			},{
				title:'File',
				isActive:false,
				subMenu:[{
					title:'新建笔记',
					event:'newNote',
					hotKey:'cmd+n'
				},{
					title:'保存',
					event:'saveNote',
					hotKey:'cmd+s'
				},{
					type: 'separator'
				},{
					title:'导入备份',
					event:'importBackup'
				}]
			},{
				title:'Edit',
				isActive:false,
				subMenu:[]
			},{
				title:'View',
				isActive:false,
				subMenu:[{
					title:'切换笔记列表',
					event:'switchLayoutSidebar',
					hotKey:'cmd+1'
				},{
					title:'切换编辑区',
					event:'switchLayoutEditor',
					hotKey:'cmd+2'
				},{
					title:'切换预览区',
					event:'switchLayoutPreview',
					hotKey:'cmd+3'
				}]
			}]
		};
		return data;
	},
	mounted(){
		menu.buildMenu(this.menuList);
		/*this.$nextTick(()=>{
			this.$dispatch('toggleMenubar', menu.isVue);
		});*/
	}
};
</script>
