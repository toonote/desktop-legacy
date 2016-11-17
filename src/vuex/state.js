// 初始状态
export default {
	contextMenuNoteId: '',
	currentNote: null,
	currentNotebook: null,
	notebooks: [],
	// 同步滚动位置数据
	scrollMap: [],
	layout:{
		sidebar: true,
		editor: true,
		preview: true
	},
	isSearching:false,
	// 搜索结果
	searchResults:[
		// {id:'1407215592432',title:'富途\\服务器相关'},
		// {id:'1471501307415',title:'富途\\前端近期'},
	],
	versions:{
		currentNote:null,
		activeVersionId:'',
		activeVersionContent:'',
		list:[]
	},
	contextMenuVersionId: '',
	editAction: '',
	// 登录信息
	user: {
		doingLogin: false,
		name: '',
		avatarUrl: ''
	}
}
