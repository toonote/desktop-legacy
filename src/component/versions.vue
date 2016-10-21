<style scoped>
.mask{
	position: absolute;
	left:0;
	top:0;
	z-index: 1;
	width:100%;
	height:100%;
	background:rgba(128,128,128,.4);
}
.versions{
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
.wrapper{
	width: 200px;
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	line-height: 24px;
	padding: 10px 0;
	overflow: auto;
	height: calc(100% - 20px);
}
.wrapper ul{
	list-style: none;
}
.wrapper li{
	font-size:13px;
	text-indent: 15px;
	/*padding-left:25px;*/
	cursor:default;
	overflow: hidden;
    white-space: nowrap;
}
.wrapper li li{
	text-indent: 34px;
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
.wrapper .note-list-move {
	transition: transform .4s;
}
.content{
	display: flex;
	flex:1;
	padding:10px;
	overflow: auto;
}
</style>

<template>
<section class="mask" v-on:click="hideVersions" v-show="versions.currentNote">
<section class="versions" v-on:click.stop="()=>{}">
	<section class="wrapper">
		<ul>
			<li
				class="icon folder"
			>{{versions.currentNote && versions.currentNote.title}}
				<ul>
					<li
						class="icon note"
						v-bind:class="{active:(versions.activeVersionId && versions.activeVersionId === version.id)}"
						v-for="version in versions.list"
						v-on:click="switchCurrentVersion(version.id)"
						v-on:contextmenu="showContextMenu(version.id)"
					>{{formatDate(version.date)}}</li>
				</transition-group>
			</li>
		</ul>
	</section>
	<section class="content"><pre>{{versions.activeVersionContent}}</pre></section>
</section>
</section>
</template>


<script>
import throttle from 'lodash.throttle';
import {mapGetters} from 'vuex';
import Menu from '../api/menu/index';
import util from '../modules/util';

let menu = new Menu(util.platform);

let _doExchange;

export default {
	computed: {
		...mapGetters([
			'versions'
		])
	},
	watch: {
	},
	methods: {
		formatDate(date){
			let ts = date.getTime() - date.getTimezoneOffset()*60*1000;
			let s = new Date(ts).toISOString();

			// s.replace(/T.+$/,'');	// 2015-11-24
			// s.replace(/\-\d+T.+$/,''); // 2015-11
			// s.replace(/(^\d+\-|T.+$)/g,''); // 11-24
			// s.replace(/(^[0-9\-]+T|\.\d+Z$)/g,''); // 14:16:18
			// s.replace(/(^[0-9\-]+T|:\d+\.\d+Z$)/g,''); // 14:16
			// s.replace(/T/g,' ').replace(/\.\d+Z$/,''); // 2015-11-24 14:16:18
			// s.replace(/T/g,' ').replace(/:\d+\.\d+Z$/,''); // 2015-11-24 14:16
			return s.replace(/T/g,' ').replace(/^\d+\-/, '').replace(/:\d+\.\d+Z$/,''); // 11-24 14:16

		},
		switchCurrentVersion(versionId){
			this.$store.dispatch('switchActiveVersion', versionId);
		},
		hideVersions(){
			this.$store.commit('hideVersions');
		}
	},
	data(){
		var data = {
		};
		return data;
	}
};
</script>
