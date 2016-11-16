<style scoped>
.login{
	padding:10px;
	margin:0 auto;
    border-bottom: 1px solid #e0e0e0;
    position: relative;
}
.login .avatar{
	width:40px;
	height:40px;
	border-radius: 40px;
	float:left;
}
.login .userInfo{
	margin-left:50px;
	height:40px;
	line-height: 40px;
	font-size:14px;
}
.login .userInfo a{
	color: #585858;
	text-decoration: none;
}
.login .labelWrapper{
	position: absolute;
	top:10px;
	right:10px;
}
.login .labelWrapper .label{
	font-size:12px;
	padding:2px 4px;
	border-radius:2px;
    background: #718c00;
    display: inline-block;
    color: white;
}
</style>

<template>
<section class="login">
	<img v-if="user.avatarUrl" class="avatar" src="https://avatars.githubusercontent.com/u/1243593?v=3" />
	<img v-else class="avatar" src="../images/avatar.png" />
	<div class="userInfo">
		<span v-if="user.name">{{user.name}}</span>
		<a v-else v-on:click="doLogin" href="#">点击登录</a>
	</div>
	<div class="labelWrapper">
		<div v-for="label in user.labels" class="label">{{label}}</div>
	</div>
</section>
</template>


<script>
import {mapGetters} from 'vuex';

export default {
	computed: {
		...mapGetters([
			'user'
		])
	},
	watch: {
	},
	methods: {
		doLogin(){
			this.$store.dispatch('doLogin');
		}
	},
	data(){
		var data = {
		};
		return data;
	},
	components:{
	}
};
</script>
