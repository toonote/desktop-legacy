import Vue from 'vue';
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focusInput', {
	componentUpdated(el){
		// 聚焦元素
		setTimeout(() => {
			el.focus();
		});
	}
});
