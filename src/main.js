import Vue from 'vue';
import Vuex from 'vuex';
Promise.all([
	import('./component/sidebar.vue'),
	import('./component/editor.vue'),
	import('./component/preview.vue'),
	import('./component/menubar.vue'),
	import('./component/versions.vue'),
	// 生成store
	import('./vuex/store')
]).then(([sidebar, editor, preview, menubar, versions, getStore]) => {
	// 使用Vuex
	Vue.use(Vuex);

	// store
	let store = getStore.default();

	let app = new Vue({
		el: '#wrapper',
		store,
		computed:{
			...Vuex.mapGetters(['layout'])
		},
		methods:{
		},
		data:{
			withMenubar:false
		},
		components: {
			menubar,
			sidebar,
			editor,
			preview,
			versions
		}
	});

	// 初始化
	store.dispatch('init');
});

// export default app;
