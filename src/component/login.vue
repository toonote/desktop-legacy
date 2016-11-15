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
	<img class="avatar" src="https://avatars.githubusercontent.com/u/1243593?v=3" />
	<div class="userInfo">
		TooBug
	</div>
	<div class="labelWrapper">
		<div class="label">VIP</div>
		<div class="label">US</div>
	</div>
</section>
</template>


<script>
import {mapGetters} from 'vuex';

export default {
	computed: {
		...mapGetters([
			'login'
		])
	},
	watch: {
	},
	methods: {
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
