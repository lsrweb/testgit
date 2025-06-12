Vue.component('paratext', window.paratext);
// Vue.component('emoticon', window.emoticonSelect);
// console.log(emoticon-select);
//#region COMMON 请求封装
function ajaxRequest(url, data, method = 'POST') {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: method,
			url: url,
			data: data,
			dataType: 'json',
			success: function (response) {
				resolve(response);
			},
			error: function (error) {
				vm.$message.error(`请求失败，${error.statusText}`);
				reject(error);
			}
		});
	});
}

//#endregion

function getLocalData(key) {
	try {
		let implPlanTime = localStorage.getItem('implPlanTime') ? JSON.parse(localStorage.getItem('implPlanTime')) : {};
		return implPlanTime[key] || '';
	} catch (error) {
		console.error('获取本地存储失败:', error);
		return '';
	}
}

var vm = new Vue({
	el: '#models',
	components: {
		'paratext': paratext, //当前页面注册组件
		'emoticon': window.emoticonSelect, //当前页面注册组件
	},
	mixins: [fanganMixin()],
	data: {
		// fold:false,// 全部折叠开关
		send_time_zhuijia: "N",
		reply_msg_index_tmp: '',
		reply_msg_tmp: {},
		loading: false,
		weijiuxu_num: 0,
		cnd_check_timer: null,
		isshowv: false,
		iyunzk_table_class: "iyunzk_table", //Table 样式
		multipleSelection: [],
		jiange_timer:'',					//时间间隔
		bianji:1,
		jobSearch: {
			kw: '',
			bianhao:'',
			fangan_id: '',
			ex_type: '',
			ex_status: '',
			order_type: '',
			order_val: '',
			type: '',
		},
		// 默认延迟
		default_yanshi: 3,
		addFadanTimingDialog: false,
		fadan_group:'',
		fangan_list: [],
		// 方案id做索引
		fangan_list_id2index: [],
		// fangan_sel:[],//选择的发单方案
		// reply_msg:{
		//   yanshi:0,
		//   msg_type_reply:"",
		//   msg:'',
		//   img_src:'',
		// },
		//
		//
		replyForm: {
			ex_type: 'timing',
			ex_time: '',
			name: '',
			fangan_sel: [],
			msg: [], //发送消息列表
			ex_day_week:['1','2','3','4','5','6','7'],
			ex_day_month:[]
		},
		reply_msg_index: '',
		reply_msg: {
			sort: 0,
			msg_type_reply: 'txt',
			yanshi: 3,
			msg: "", // [ { trigger_msg: "", trigger_type: 'like',msg_reply_type: "2",robot_reply_type: 'suiji', robot_suiji_count:1,sort:0, msg:[{  msg_type_reply: 'txt', yanshi: 3, msg: '', sort: 0,children:[] ,robot_index:1}]}  ],
			title: '',
			url: '',
			desc: '',
			img_src: '',
			file_size: 0,
			jisu_stuatus: '准备中',
			jisu_stuatus_qy: '准备中',
			geren:'',
			qiye: ''
		},
		msgTypeList_reply: [{
				id: 'txt',
				name: '文本'
			},
			{
				id: 'img',
				name: '图片'
			},
			{
				id: 'shipin',
				name: '视频'
			},
			{
				id: 'card',
				name: '卡片'
			},
			{
				id: 'gif',
				name: '动态表情'
			},
			{
				id: 'xiaochengxu',
				name: '小程序'
			},
			{
				id: 'shipinhao',
				name: '视频号'
			},
			{
				id: 'file',
				name: '文件'
			},
			{
				id: 'liaotianjilu',
				name: '聊天记录'
			},
			{
				id: 'voice',
				name: '语音'
			},
			{
				id: "note",
				name: "收藏笔记"
			}

		],
		uid:pageData.uid,
		// 语音参数
		voiceDialog:false,
		voiceRobotSelect:'',
		voiceRobotList:[],
		collectionData:{
			loading:false,
			page:1,
			size:20,
			list:[],
			remark:''
		},
		voiceSelet:'',
		newVoiceDialog:false,
		newVoiceLoading:false,
		newVoicerData:'',
		newVoiceremarks:'',
		newVoicerSetTimeOff:null,
		// job_name:'',
		blur_index_area_reply: 0,
		wx_emoji: ["微笑", "撇嘴", "色", "发呆", "得意", "流泪", "害羞", "闭嘴", "睡", "大哭", "尴尬", "发怒", "调皮", "呲牙", "惊讶", "难过",
			"囧", "抓狂", "吐", "偷笑", "愉快", "白眼", "傲慢", "困", "惊恐", "憨笑", "悠闲", "咒骂", "疑问", "嘘", "晕", "衰", "骷髅",
			"敲打", "再见", "擦汗", "抠鼻", "鼓掌", "坏笑", "右哼哼", "鄙视", "委屈", "快哭了", "阴险", "亲亲", "可怜", "笑脸", "生病",
			"脸红", "破涕为笑", "恐惧", "失望", "无语", "嘿哈", "捂脸", "奸笑", "机智", "皱眉", "耶", "吃瓜", "加油", "汗", "天啊", "Emm",
			"社会社会", "旺柴", "好的", "打脸", "哇", "翻白眼", "666", "让我看看", "叹气", "苦涩", "裂开", "嘴唇", "爱心", "心碎", "拥抱",
			"强", "弱", "握手", "胜利", "抱拳", "勾引", "拳头", "OK", "合十", "啤酒", "咖啡", "蛋糕", "玫瑰", "凋谢", "菜刀", "炸弹",
			"便便", "月亮", "太阳", "庆祝", "礼物", "红包", "發", "福", "烟花", "爆竹", "猪头", "跳跳", "发抖", "转圈"
		],
		// 表情包
		oss_host: "https://oss.iyunzk.com/",
		gif_active_cur: "keai",
		radio: "",
		form: {
			bank: "",
		},
		gifList: [],
		gifList_keai: [{
				"url": "wxmanger/im_gif/iQP1jI9B_639c14a61d028.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c157184f43.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15763d7ab.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1577df568.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c157b5f717.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15802bf0d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15826ef3f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15865b9bc.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c158d32c8a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c158f8ff42.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15933a5e1.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1594374cf.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c159a8460c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c159b9892d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c159e8fb7e.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15aa6f190.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15b09899d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15b4f0fdf.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15b8483ff.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15bc7bcd4.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15c336bd7.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15c77737f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15ce52f32.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15d2c3849.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15d4a5b48.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15d8f1ec8.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15db2dc44.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15dd565d9.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15e11bf1d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c15e32baa7.gif"
			}
		],
		gifList_gaoguai: [{
				"url": "wxmanger/im_gif/iQP1jI9B_639c194f5ab76.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c195fcb132.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c196118d19.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c19661371d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c196f6d62b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c197ac9aa1.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1983d5436.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c198d1eb39.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c199017663.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1991d4cba.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c199729b6e.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c19a35273f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c19a497a70.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c19a64455c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c19ae5d0c0.gif"
			}
		],
		gifList_chaiquan: [{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1af62553d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1af897b78.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1af9caa45.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1afdcfdd8.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1aff3832c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b0080a43.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b0351058.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b0a180ad.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b0b6d980.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b0f575dc.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b10afcba.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b15af712.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b1742b5b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b1915339.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b1c3990f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b1d8bbff.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b218cea2.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b2469ec3.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b286de44.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b2a0b6b9.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b2b7144d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b3df0679.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b45a2744.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b473ce79.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b49473bb.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b4b1d51a.gif"
			},
			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b4e3676b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b53ad538.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b55d6b69.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b58d412a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b5c04864.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1b5dde209.gif"
			}

		],
		gifList_yaoyiyao: [{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c6f74db6.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c7175d21.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c739d32d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c77c2c53.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c798acda.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c7b90332.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c7e38d7d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c8040b8f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c833da4a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c86cacc5.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c891819d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c8b53e1a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c8e34306.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c910e9cc.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c934ee2d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c96dc9db.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c99d5ba4.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c9d93f4c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1c9ff2d53.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ca3423f9.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ca5b1da1.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ca7dab1b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1caac42a2.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cae0ce38.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cb0a147b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cb2dd537.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cb5b1ead.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cb8127ed.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cba6561e.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cbd6d5c2.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cbfd9b46.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cc1ee351.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cc45e7cf.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cc76cccf.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cc9ec770.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ccdab225.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cd020382.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cd30d4f7.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cd5d1b6a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cd886b3d.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cdb59b06.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1cddaf417.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ce1bb37a.gif"
			}
		],

		gifList_anzhongguancha: [{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e5672dd5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e57b3b1b.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e5b8dfc6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e5f41c8d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e60aff2a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e6244cbf.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e6531abf.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e6a1327a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e6d125fd.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e6e7a9bf.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e7254fd3.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e767bb93.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e77e7ea0.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e7b3db06.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e7ce9901.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e7ea562b.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e815eb26.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e83016ce.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e84c0a20.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e88267af.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e8a1c2f3.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e8b6c5d2.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e8d1ddd2.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e8f4ed87.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9154df6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9399ca4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e950bc93.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e96d0122.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9836482.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e99d4282.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9bf09f5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9d445e1.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1e9ed399f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ea049a88.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ea1cf591.gif"
			}
		],
		gifList_woyao: [{
				"url": "wxmanger/im_gif/tTmaymn0_639c1894973c2.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c189d2ae76.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c189ee2a65.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18a09c5e7.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18a26e73e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18a431aec.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18a68b5f5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18a88d840.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18aaea24c.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18aca264c.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18ae7d5b0.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18b0f0a64.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18b33f5e5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18b511258.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18b70c0c7.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18ba82884.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18bc7a4bb.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18be1ae45.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18bf8bb0d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18c2e733d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18c4d62f7.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18c75b149.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18ca69d89.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18cc32415.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18ce00440.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c18d38624a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c191cf3180.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c191ec51ed.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c19208863a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c192228173.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c192389093.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c19252589f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1926a0f77.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c19285c8ed.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1929f1be0.gif"
			}
		],
		gifList_zai: [{
				"url": "wxmanger/im_gif/tTmaymn0_639c159cc96b9.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15a882e71.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15aa6254e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15ac2e70d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15b05da49.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15b44263c.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15b69b30f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15b8a5624.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15baa9981.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15be2e499.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15bff2294.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15c24ad23.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15c574d68.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15c76ac45.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15c90bb6e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15cb2c809.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15cd71e30.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15cf9c24d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15d15fc57.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15d333d6b.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15d59ee04.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15d784186.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15db6cfad.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15dd0e63d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15deb1be5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15e072189.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15e20d679.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15e4ae89e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15e750609.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15e92ea9b.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15eade4c4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15ec945b4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15ee57ad0.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15f005175.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15f287b99.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c15f45e910.gif"
			}
		],
		gifList_dianzan: [{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d0ba2e13.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d11b78c4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d15a0378.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d2710b4a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d28e373f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d2c25b9f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d2db307f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d2f7da16.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d3583359.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d39059b8.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d3ac0300.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d3e413d6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d406d05e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d41db321.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d4575d93.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d4758424.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d4cbb23d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d4ebd8f8.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d502602f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d517fec5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d5335335.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d560e916.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d578ced4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1d594621e.gif"
			}
		],
		gifList_jushou: [{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ad48b8b4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ad91fd1e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1add005a6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ade718b4.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ae001240.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ae3ae905.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ae5e5aec.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ae7cfb40.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1ae982ca6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1aeb20058.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1af3ebb69.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1afa5383f.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1afbca0e1.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1afdddbd5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1affbc8c7.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b02a4046.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b04e87c5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b072730c.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b08b88fd.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b0bb16c8.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b0de1c1d.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b11360d7.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b1293d2a.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b143dafa.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b15e8937.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b1b8cda6.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b1cde559.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b1e6d0b5.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b2015df2.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b221131e.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b2376516.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b2837bcb.gif"
			},

			{
				"url": "wxmanger/im_gif/tTmaymn0_639c1b2a08c7f.gif"
			}
		],
		gifList_wolaile: [{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ea86d81c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eaae5564.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eac30e4a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eaf2c981.gif"
			},
			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eb059b9c.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eb18f359.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eb41b21b.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eb69dc50.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eb8d93cd.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1eba12981.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ebb447e9.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ebd5a722.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ebe78171.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ec272ffb.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ec3a8a28.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ec4d2239.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ec784455.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ec9c0d3a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ece4a37a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ecf9545f.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ed30bad7.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ed45535a.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ed806a75.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ed94c49e.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1edaabb61.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1edd17226.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ee00b6e3.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ee2626f6.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ee386e18.gif"
			},

			{
				"url": "wxmanger/im_gif/iQP1jI9B_639c1ee7241a4.gif"
			}
		],
		// 表情包
		//
		//
		//定时发单数据
		fadanLoad:false,
		table_data: {
			list: [],
			total: 0,
			size: 20,
			totalPage: 0,
			currPage: 1,
		},

		activeName: "ds",

		show_rule_log: false,
		setting_params: {
			title: '',
			lm_id: "",
			config: {
				text_ys: 3,
				pic_ys: 3,
				video_ys: 3,
				gif_ys: 3,
			},
			fangan_sel: [],
			status: "Y",
			fadan_status: 'Y',
		},
		iyunzk_table_class: "",
		loading: true,
		show_add_setting: false,
		select_group:'',
		searchParams: {
			page: 1,
			size: 10,
			title: "",
			lm_id: "",
			fanganid: "",
		},
		tableData: {

		},
		fangan_list: [],
		group_list:[],
		cur_group:'',			//定时发单选择的分组
		sel_group:'',			//选品选中的分组
		taobaoAccountlist: [],
		// 淘宝授权链接
		tb_auth_url: '',
		rule_log_params: {
			page: 1,
			size: 20,
			fanganid: ""
		},
		rule_log_data: {

		},
		job_id: 111,
		yinyong: 0,

		batchUpLoading: false,

		finishTime: '', //预计完成时间
		tipsFlag:false, //开启弹窗提示
		tipsRow: {},
		msg:'',
		setNum:'1',
		disposable:'0',		//是否从当前时间开始执行
		exTime:"",
		default_time:"",

		paratextDom: null,
		zidingyi_timer:'',
		saveError: 0,
		replyFormWeekHuancun:{   //暂存发单详情里的日期
			type:'',
			list:[]
		},
		zhou_day: 0,
		// 删除时间设置
		delTimeDialog:false,
		delConfig:90,

		timeVisible:false,
		days:'',
		taskType:'1',
		// 同步内容到其他发单任务
		asyncDialog:false,
		replaceId:"",
		searchIds:[],
		asyncList:[],
		asyncLoad:false,
		asyncSearch:{
			page:1,
			size:20,
			total:0,
			bianhao:"",
			kw:'',
			cur_group:'',
			fangan_id:'',
			ex_status:'',
			ex_type:'',
			type:'',
		},
		// 提示是否需要重新上传CDN
		needTipsCDN:false,
		plSchemeDialog:false,
		schemeForm:{
			ids:[],
			fangan_sel:[],
			type:'zhuijia',
			cur_group:'',
		},
		tableSort: '',
	},
	computed: {
		fold:{
			get(){
				// 如果没数据则返回false
				if(!this.replyForm.msg.length) return false;
				let allFold = this.replyForm.msg.map((item) => {
					return item.fold
				});
				let allTrue = allFold.every((item) => item === true);
				return allTrue;

			},
			set(val){
				this.replyForm.msg.map((item) => {
					item.fold = val;
				});
				return val;
			}
		}
	},
	methods: {
		setLocalTime() {
			const savedExType = getLocalData('ex_type');
			if (savedExType) {
				this.replyForm.ex_type = savedExType

				if (savedExType === 'day' || savedExType === 'timing_week') {
					let savedWeekDays = getLocalData(`ex_day_week_${savedExType}`);
					if (!savedWeekDays || !Array.isArray(savedWeekDays)) {
						savedWeekDays = getLocalData('ex_day_week');
					}
					if (savedWeekDays && Array.isArray(savedWeekDays)) {
						this.replyForm.ex_day_week = savedWeekDays;
					}
				} else if (savedExType === 'month') {
					const savedMonthDays = getLocalData('ex_day_month');
					if (savedMonthDays && Array.isArray(savedMonthDays)) {
						this.replyForm.ex_day_month = savedMonthDays;
					}
				}
				const savedYanshiTimer = getLocalData('zidingyi_timer');
				if (savedYanshiTimer !== '' && savedYanshiTimer !== null) {
					this.zidingyi_timer = savedYanshiTimer;
				}
				const savedSendTimeZhuijia = getLocalData('send_time_zhuijia');
				if (savedSendTimeZhuijia) {
					this.send_time_zhuijia = savedSendTimeZhuijia;
				}
				this.$forceUpdate()
				this.addCacheTimer();
			}
		},
		sortChange({ order }) {
			if (order == "ascending") {
				this.tableSort = 'asc';
			}
			if (order == "descending") {
				this.tableSort = 'desc';
			}
			if(!order){
				this.tableSort = '';
			}
			this.getFaDanTimingList();
		},
		// wx/FaDanTiming/updateSort
		saveSort(row) {

			this.$nextTick(() => {
				$.post('/wx/FaDanTiming/updateSort', {
					id: row.id,
					sort: row.sort,
				}, (res) => {
					if (res.code == 200) {
						this.$set(row, 'isEditingSort', false);
						this.getFaDanTimingList();
					} else {
						this.$message({ message: res.msg, showClose: true, offset: 120, type: 'error', })
						this.$set(row, 'isEditingSort', false);
					}
				})
			})
		},
		setOtherSort(row, index) {
			row.originalSort = row.sort;
			let hasEditing = false;
			this.table_data.list.forEach((item, i) => {
					if (i != index && item.isEditingSort) {
							// 如果有其他行正在编辑，先保存
							this.saveSort(item);
							hasEditing = true;
					}
					// 关闭所有行的编辑状态
					if (i != index) {
							this.$set(item, 'isEditingSort', false);
					}
			});

			// 打开当前行的编辑状态
			if(!hasEditing) this.$set(this.table_data.list[index], 'isEditingSort', true);
			// 聚焦
			this.$nextTick(() => {
					this.$refs.sortInput.focus();

			});
	},
		handleMoreBatch(command){
			if(command == 'withdraw'){
				this.withdraw(this.multipleSelection);
			}else if(command == 'handleUpdateTime'){
				this.handleUpdateTime();
			}else if(command == 'handlePlScheme'){
				this.handlePlScheme();
			}
		},
		// 批量设置发单方案
		plSetFaDanTimingFangan(){
			if(this.schemeForm.fangan_sel.length == 0){
				this.$message({message:'请选择发单方案',offset:120,type:'warning',})
				return;
			}
			this.$confirm('确定要修改当前选中的发单任务中的发单方案吗？','提示',{
				type:'warning',
				confirmButtonText:'确定',
				cancelButtonText:'取消',
			}).then(()=>{
				$.post('/wx/FaDanTiming/plSetFaDanTimingFangan',this.schemeForm,(res)=>{
					console.log(res);
					if(res.code == 200){
					this.plSchemeDialog = false;
					this.$message({message:res.msg,showClose:true,offset:120,type:'success',})
					this.getFaDanTimingList();
				}else{
					this.$message({message:res.msg,showClose:true,offset:120,type:'error',})
					}
				})
			})
		},
		// 批量发送
		handlePlScheme(){
			if(!this.multipleSelection.length){
				this.$message({message:'请选择需要同步的发单任务',type:'warning',showClose:true,offset:120});
				return;
			}
			this.plSchemeDialog = true;
			this.schemeForm.ids = this.multipleSelection.map(item=>item.id);
		},
		// 提交同步
		subSyncList(){
			if(!this.searchIds.length){
				this.$message({message:'请选择需要同步的发单任务',type:'warning',showClose:true,offset:120});
				return;
			}
			this.$confirm("将内容同步到选中的发单任务，原有的内容将会被覆盖，同步仅同步内容，任务状态和时间均不会更改，如需要执行请确认任务的执行时间",'提示',{
				type:"warning"
			}).then(()=>{
				$.post("/wx/FaDanTiming/replaceFaDanTimingContent",{
					replace_id:this.replaceId,
					search_ids:this.searchIds.map(item=>item.id),
				},(json)=>{
					if(json.code == 200){
						this.$message({message:json.msg,showClose:true,offset:120,type:'success',})
						this.asyncDialog = false;
						this.getFaDanTimingList();
					}else{
						this.$message({message:json.msg,showClose:true,offset:120,type:'error',})
					}
				})
			}).catch(()=>{

			})
		},
		// 关闭同步内容
		closeAsync(){
			this.replaceId = "";this.searchIds = [];
			this.$refs.asyncList.clearSelection();
			this.asyncSearch = {
				page:1,
				size:20,
				total:0,
				bianhao:"",
				kw:'',
				cur_group:'',
				fangan_id:'',
				ex_status: '',
				ex_type:'',
				type:'',
			};
		},
		// 同一个任务无法同步
		controlSelect(e){
			return e.id != this.replaceId;
		},
		// 同步内容到其他任务
		syncContent(id){
			this.replaceId = id;
			this.asyncDialog = true;
			this.getAsyncList(1);
		},
		getAsyncList(page){
			this.asyncSearch.page = page ? page : this.asyncSearch.page;
			this.getFaDanTimingList("async");
		},
		selSync(selection){
			this.searchIds = selection;
		},
		selSyncOne(selection,row){
			if (selection.length > 5) {
				this.$refs.asyncList.toggleRowSelection(row, false);
				this.$message({
					message:'最多只能选择 5 条数据',
					type:'warning',
					showClose: true,
					offset:120
				});
			}
		},
		syncSizeChange(e){
			this.asyncSearch.size = e;
			this.getFaDanTimingList("async");
		},
		handleUpdateTime(){
			if(!this.multipleSelection.length){
				this.$message.warning({message:'请选择需要修改时间的任务',offset:120})
				return
			}
			this.timeVisible = true;
		},
		// 修改默认时间
		changeDefaultTime(e) {
			if(e == "1"){
				this.exTime = timestampToTime(new Date().getTime() + 10000,0,13).replace(/\//g,'-');
			}
		},
		// 批量修改发单时间
		_resetTaskTime(){
			if(!this.days){
				this.$message.warning({message:'请输入时间',offset:120})
				return
			}
			$.post('/wx/FaDanTiming/resetTaskTime', {
				ids: this.multipleSelection.map(item => item.id),
				days: this.days,
				type: this.taskType,
			},res=>{
				console.log(res);
				if(res.code == 200){
					this.getFaDanTimingList();
					this.timeVisible = false;
					this.$message({message:res.msg,offset:120,type:"success",})
				}else{
					this.$message({message:res.msg,offset:120,type:"error",})
				}
			})
		},
		// 指定时间内的删除
		command_del(){
			this.delTimeDialog = true;
		},
		// 设置删除天数
		setDelTime(event){
			if(!event){
				this.$nextTick(()=>{
					this.$set(this,'delConfig',90);
				})
			}
		},
		// 获取上次设置的删除天数
		getDelTime(){
			$.post('/wx/FaDanTiming/getTimingClearConfig', {},(res)=>{
				if(res.code == 200){
					this.$set(this,'delConfig',res.data ? Number(res.data) : 90);
				}else{
					this.$message({message:res.msg,showClose:true,offset:120,type:"error",})
				}
			})
		},
		// 保存删除天数
		saveDelTime(){
			$.post('/wx/FaDanTiming/timingClearConfig', {
				config:this.delConfig,
			},(res)=>{
				if(res.code == 200){
					this.$message({message:res.msg,showClose:true,offset:120,type:"success",})
					this.delTimeDialog = false;
				}else{
					this.$message({message:res.msg,showClose:true,offset:120,type:"error",})
				}
			})
		},
		// 撤回
		withdraw(list){
			var tips = '';
			if(!list.length){
				this.$message({message:'请选择需要撤回的任务',offset:120,showClose:true,type:'error'})
				return;
			}
			tips = list.length == 1 ? '撤回两分钟内的消息，待执行的任务会被终止。确定撤回该发单任务？' : '撤回两分钟内的消息，待执行的任务会被终止。确定撤回选中的发单任务';
			this.$confirm(tips,'提示',{
				type:'warning'
			}).then(()=>{
				$.post('/wx/FaDanTiming/chehuiFaDanTiming', {
					ids:list.map(item=>item.id),
				},(res)=>{
					console.log(res);
					if(res.code == 200){
						this.$message({message:res.msg,showClose:true,offset:120,type:"success",})
						this.doSearch();
					}else{
						this.$message({message:res.msg,showClose:true,offset:120,type:"error",})
					}
				})
			}).catch(()=>{

			})
		},
		asyncParatextContent(){
			var that = this;
			if(that.reply_msg.msg_type_reply=='txt'){
				that.paratextDom.echoContent(that.reply_msg.msg);
			}
		},
		// 字符替换表情
		relpaceContent(str){
			return str.replace(/\r\n|\r|\n/g, '<br />').replace(/\$emoji表情\[(\d+)\]\$/g, (match, p1) => {return `<img src="${emoji[p1]}" />`});
		},
		do_close_setting() {
			console.log('执行窗口关闭');
		},
		handleClick() {
			location.hash = this.activeName;

			// 切换选项的时候，重新刷新列表数据
			if (this.activeName == 'ds') {
				this.getFaDanTimingList();

			} else if (this.activeName == 'xp') {
				this.getlist();

			}

		},
		sendTimeZhuijiaChange() {
			var that = this;
			localStorage.setItem('send_time_zhuijia_fadan', that.send_time_zhuijia);
		},
		//设置定时时间
		setDingshi(minute) {
			var that = this;
			if (that.send_time_zhuijia == 'N') {
				var timestamp = new Date().getTime() / 1000; //返回数值单位是毫秒；
				console.log(timestamp)
				var cur_time = timestampToTime(timestamp + 60 * minute, 3, 10);
				that.replyForm.ex_time = cur_time;
				that.dingshi_date = "1"; //设置成今天
			} else {
				//定时发送 追加模式
				var timestamp = new Date().getTime() / 1000;
				if (that.replyForm.ex_time == '') {
					that.replyForm.ex_time = timestampToTime(timestamp, 3, 10);
				}
				var date_new = new Date(that.replyForm.ex_time);
				var timestamp_new = date_new.getTime() / 1000;
				var cur_time = timestampToTime(timestamp_new + 60 * minute, 3, 10)
				that.replyForm.ex_time = cur_time;
			}
			let yanshi = 0;
			if (this.replyForm.msg.length) {
				this.replyForm.msg.forEach((item, index) => {
					yanshi = yanshi + Number(item.yanshi);
				})
			}
		},

		// 添加缓存
		getHuanTimer(){
			var that = this
			localStorage.setItem('prevTimer',that.zidingyi_timer);    //缓存时间间隔
			var prevTimer =  new Date(that.replyForm.ex_time).getTime() / 1000
			localStorage.setItem('minuteTimer',prevTimer);   //缓存的时间区间

			// prevTimer 高级设置自动追加
			// minuteTimer 上次创建发单的时间
		},
		//重试上传cdn
		reExUploadCDN(msg_item, is_reUpload = 'Y') {
			var that = this;
			console.log('reExUploadCDN', msg_item);
			//这里设置成准备中 导致没有选择发单方案的时候 页面卡在 准备中无法继续流程,在下面调用exUploadCDN 有设置准备中状态 这里不需要设置
			//msg_item.jisu_stuatus='准备中';
			//msg_item.jisu_stuatus_qy='准备中';
			//that.$forceUpdate();
			that.exUploadCDN(is_reUpload, msg_item);
		},
		//检查并提前触发 图片cdn 上传
		exUploadCDN(is_reUpload = 'Y') {
			var that = this;
			//检查是否选择发单方案 ,填写任务名称  选择执行周期 执行时间
			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			that.reply_msg.jisu_stuatus = that.reply_msg.jisu_stuatus_qy = '准备中';
			var item = that.reply_msg;
			// if(that.msg_api_type=='jisu'){
			//var robot_sel_arr= that.multipleSelection_for_search_robot;
			//var robot_sel_arr= that.multipleSelection_robot;
			//var robot_arr = [];
			var img_arr = [];
			var type_arr = [];
			//if(robot_sel_arr.length > 0){
			//检查右侧是否有图片  图片数组 { type: 'txt', value: '', img_src: '', children: [] }
			//that.msg_list.forEach(item => {
			if (item.msg_type_reply == 'img' || item.msg_type_reply == 'shipin' || item.msg_type_reply ==
				'gif' || item.msg_type_reply == 'card' || item.msg_type_reply == 'file') {
				img_arr.push(item.msg);
				if (item.jisu_stuatus != '就绪') {
					item.jisu_stuatus = '准备中';
				}
				if (item.jisu_stuatus_qy != '就绪') {
					item.jisu_stuatus_qy = '准备中';
				}
				type_arr.push(item.msg_type_reply);
			}
			// item.children.forEach(item_son => {
			//     if (item_son.type == 'img'||item_son.type=='shipin'||item_son.type=='gif') {
			//         img_arr.push(item_son.value);
			//         type_arr.push(item_son.type);

			//         if(item_son.jisu_stuatus!=='就绪'){
			//             item_son.jisu_stuatus='准备中';
			//         }
			//     }
			// })
			// });
			//that.$forceUpdate();
			//机器人数组
			// robot_sel_arr.forEach(row => {
			//     var robot_tmp ={wxid:row['wxid'],wx_type:row['wx_type']};
			//     robot_arr.push(robot_tmp);
			// })
			//}
			// 需要提交到去触发上传CDN
			if (img_arr.length > 0) { //robot_arr.length>0&&
				$.post('/wx/FaDanTiming/exUploadCDN', {
					is_upload: is_reUpload,
					fangan_ids: that.replyForm.fangan_sel,
					types: type_arr,
					imgs: img_arr
				}, function(json) {
					if (json.code == 200) {
						json.data.map((img_src, index) => {
							if (img_src['robot_type'] == "gr_b") {
								item.jisu_stuatus = '准备中';
								item.jisu_stuatus_qy = '未就绪';
							} else if (img_src['robot_type'] == "qy") {
								item.jisu_stuatus = '未就绪';
								item.jisu_stuatus_qy = '准备中';
							}
						})
						var cacheKeyArr = json.data;
						var check_num = 0;
						that.cnd_check_timer = setInterval(function() {
							//执行检测是否cdn就绪
							that.checkCDN(check_num++, cacheKeyArr, img_arr);
						}, 1000)
					} else {
						console.log(json.msg)
						that.$message({
							message: json.msg,
							type: 'error',
							offset: 200,
							duration:1750,
						})
					}
				}, "json");
			}
			//}
		},

		checkCDN(check_num, cacheKeyArr = [], img_arr = []) {
			var that = this;
			if (check_num >= 5) {
				console.log('超时未就绪');
				//clearInterval(that.cnd_check_timer);
				for (var i = 1; i <= that.cnd_check_timer; i++) {
					clearInterval(i);
				}
				setTimeout(function() {
					that.$forceUpdate();
					console.log('$forceUpdate')
				}, 50)
				return false;
			}

			$.post('/wx/FaDanTiming/checkImgCDN', {
				cache_key_arr: JSON.stringify(cacheKeyArr)
			}, function(json) {
				if (json.code == 200) {
					var check_data = JSON.parse(JSON.stringify(json.data));
					that.weijiuxu_num = 0;
					var item = that.reply_msg;
					let idx1 = check_data.findIndex(line => line.key == item.msg + "-gr_b");
					if (idx1 != '-1') {
						item.jisu_stuatus = check_data[idx1].value == 'Y' ? '就绪' : check_num >= 4?'未就绪':'准备中';
						if (check_data[idx1].value != 'Y') {
							that.weijiuxu_num++;
						}
					} else {
						item.jisu_stuatus = '';
					}
					let idx2 = check_data.findIndex(line => line.key == item.msg + "-qy");
					if (idx2 != '-1') {
						item.jisu_stuatus_qy = check_data[idx2].value == 'Y' ? '就绪' : check_num >= 4 ? '未就绪' :'准备中';
						if (check_data[idx2].value != 'Y') {
							that.weijiuxu_num++;
						}
					} else {
						item.jisu_stuatus_qy = '';
					}
					// check_data.forEach((img_src)=>{
					//that.msg_list.forEach(item => {
					// if (item.msg_type_reply=='img'||item.msg_type_reply=='shipin'||item.msg_type_reply=='gif'){
					//     if(img_src['key']==item.msg+"-gr_b"){
					//         if(img_src['value']=='Y'){
					//             item.jisu_stuatus='就绪';
					//             item.jisu_stuatus_qy='';
					//         }else{
					//             item.jisu_stuatus='未就绪';
					//             item.jisu_stuatus_qy='';
					//             that.weijiuxu_num++;
					//         }
					//     }else if(img_src['key']==item.msg+"-qy"){
					//         if(img_src['value']=='Y'){
					//             item.jisu_stuatus='';
					//             item.jisu_stuatus_qy='就绪';
					//         }else{
					//             item.jisu_stuatus='';
					//             item.jisu_stuatus_qy='未就绪';
					//             that.weijiuxu_num++;
					//         }
					//     }
					// }
					// item.children.forEach(item_son => {
					//     if (item_son.type == 'img'||item_son.type=='shipin'||item_son.type=='gif') {
					//         if(img_src['key']==item_son.value){
					//             if(img_src['value']=='Y'){
					//                 item_son.jisu_stuatus='就绪';
					//             }else{
					//                 item_son.jisu_stuatus='未就绪';
					//                 that.weijiuxu_num++;
					//             }
					//         }
					//     }
					// })
					//})
					// })
					//console.log('that.weijiuxu_num',that.weijiuxu_num)
					//console.log('reply_msg',that.reply_msg);
					if (that.weijiuxu_num == 0) {
						//全部就绪
						//that.$forceUpdate();
						// clearInterval(that.cnd_check_timer);
						for (var i = 1; i <= that.cnd_check_timer; i++) {
							clearInterval(i);
						}
						setTimeout(function() {
							that.$forceUpdate();
							console.log('$forceUpdate')
						}, 50)
					}
				} else {
					console.log(json.msg)
				}
			}, "json");
		},
		//编辑一条消息
		editReplyMsg(index) {
			let foldCount = 0; // 折叠的数量
			this.replyForm.msg.forEach((item, idx) => { // 遍历所有消息
				if(!item.showContent){
					foldCount++; // 统计折叠的数量
				}
			})
			if(foldCount == this.replyForm.msg.length){ // 全部折叠
				this.fold = true;
			}else{
				this.fold = false;
			}
			if (this.replyForm.msg[index] != undefined) {
				this.replyForm.msg.splice(index, 1, this.replyForm.msg[index]); // 去消息列表中删除当前消息

				this.reply_msg_index = index;
				this.reply_msg = this.replyForm.msg[index];
				// 赋值后重新设置
				this.reply_msg['geren'] = this.replyForm.msg[index]['geren'] ? this.replyForm.msg[index]['geren'] : '';
				this.reply_msg['qiye'] = this.replyForm.msg[index]['qiye'] ? this.replyForm.msg[index]['qiye'] : '';

				//把编辑前的内容放到第三变量进行暂存
				this.reply_msg_index_tmp = JSON.parse(JSON.stringify(index));
				this.reply_msg_tmp = JSON.parse(JSON.stringify(this.replyForm.msg[index]));
				this.asyncParatextContent();
			}

		},
		//取消编辑 重新赋值成编辑前的数据
		cancelEditReplyMsg() {
			var that = this;
			that.reply_msg_index = that.reply_msg_index_tmp;
			that.reply_msg = that.reply_msg_tmp;
			that.replyForm.msg[that.reply_msg_index] = JSON.parse(JSON.stringify(that.reply_msg));
			that.closeEditReplyMsg();
		},

		// 完成编辑
		closeEditReplyMsg() {
			let that = this;
			this.reply_msg_index = '';
			this.reply_msg = {
				sort: 0,
				msg_type_reply: 'txt',
				yanshi: this.default_yanshi,
				msg: "",
				img_src: '',
				title: '',
				desc: '',
				url: '',
				file_size: 0,
			};
			this.reply_msg_index_tmp = '';
			this.reply_msg_tmp = {
				sort: 0,
				msg_type_reply: 'txt',
				yanshi: this.default_yanshi,
				msg: "",
				title: '',
				desc: '',
				url: '',
				img_src: '',
				file_size: 0,
			};
            this.asyncParatextContent();
			// 计算预计执行时间
			let yanshi = 0;
			that.replyForm.msg.forEach((item, index) => {
				yanshi = yanshi + Number(item.yanshi);
			})
			let executeWay = that.replyForm.ex_type;
			if (executeWay == 'now') {
				that.finishTime = timestampToTime(new Date().getTime() + yanshi * 1000, 0, 13);
			} else if (executeWay == 'day' && that.replyForm.ex_time) {
				let time = new Date().getFullYear() + '-' + (new Date().getMonth() + 1 >= 10 ? new Date()
					.getMonth() + 1 : '0' + (new Date().getMonth() + 1)) + '-' + (new Date().getDate() >=
					10 ? new Date().getDate() : '0' + new Date().getDate());
				that.finishTime = timestampToTime(new Date(time + ' ' + that.replyForm.ex_time).getTime() +
					yanshi * 1000, 0, 13);
			} else if (executeWay == 'timing' && that.replyForm.ex_time) {
				that.finishTime = timestampToTime(new Date(that.replyForm.ex_time).getTime() + yanshi * 1000, 0,
					13);
			}
		},
		//增加一条消息
		addReplyMsg(index, action) {
			var that = this;
			var new_index = 0;
			if (action == "up") {
				//前增加
				new_index = 0;
				if (index > 0) {
					new_index = index;
				}

			} else {
				//后增加
				new_index = index + 1;
			}
			console.log('index', index, 'new_index', new_index)
			var msg_item = {
				sort: 0,
				msg_type_reply: 'txt',
				yanshi: this.default_yanshi,
				msg: "",
				img_src: '',
				file_size: 0,
				showContent:true,
			};
			that.reply_msg = msg_item;
			this.replyForm.msg.splice(new_index, 0, msg_item);
			setTimeout(function() {
				that.editReplyMsg(new_index);
			}, 10)

		},
		//移动回复消息位置
		moveReplyMsgSon(reply_msg, replymsg_index, action, replymsg_index_top) {
			var that = this;
			if (action == 'up') {
				if (replymsg_index == 0) {
					that.$message({
						message: '已经到最顶了',
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return false;
				}
			} else {
				if (replymsg_index == (that.replyForm.msg.length - 1)) {
					that.$message({
						message: '已经最低了',
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return false;
				}

			}
			var index = 0;
			that.replyForm.msg.splice(that.replyForm.msg.indexOf(reply_msg), 1);
			if (action == 'up') {
				index = replymsg_index - 1;
				reply_msg.sort = reply_msg.sort - 1;
			} else {
				index = replymsg_index + 1;
				reply_msg.sort = reply_msg.sort + 1;
			}
			that.replyForm.msg.splice(index, 0, reply_msg);
			//更新sort
			that.replyForm.msg.forEach((msg, index_msg) => {
				that.replyForm.msg[index_msg].sort = index_msg;
			})
		},
		datadragEnd(evt) {
			evt.preventDefault();
			console.log('新索引', evt.newIndex);
			this.reply_msg_index = evt.newIndex;
		},
		exTypeChange() {
			var that = this;
			that.replyForm.ex_time = '';
			that.finishTime = '';
			if (this.replyForm.ex_type == 'now' && this.replyForm.msg.length) {
				let yanshi = 0;
				this.replyForm.msg.forEach((item, index) => {
					yanshi = yanshi + Number(item.yanshi);
				})
				that.finishTime = timestampToTime(new Date().getTime() + yanshi * 1000, 0, 13);
			}
			if(that.replyFormWeekHuancun.type != '' && that.replyFormWeekHuancun.type == that.replyForm.ex_type  ){
				that.replyForm.ex_day_week = that.replyFormWeekHuancun.list;
			}else{
				if(that.replyForm.ex_type == 'day'){
					that.replyForm.ex_day_week = ['1','2','3','4','5','6','7'];
				}else{
					that.replyForm.ex_day_week = [];
				}
			}
		},
		// 计算预计完成时间
		calcFinishTime() {
			let yanshi = 0;
			if (this.replyForm.msg.length) {
				this.replyForm.msg.forEach((item, index) => {
					yanshi = yanshi + Number(item.yanshi);
				})
			}
			if (this.replyForm.ex_type == 'day') {
				let time = new Date().getFullYear() + '-' + (new Date().getMonth() + 1 >= 10 ? new Date()
					.getMonth() + 1 : '0' + (new Date().getMonth() + 1)) + '-' + (new Date().getDate() >=
					10 ? new Date().getDate() : '0' + new Date().getDate());
				this.finishTime = timestampToTime(new Date(time + ' ' + this.replyForm.ex_time).getTime() +
					yanshi * 1000, 0, 13);
			} else if (this.replyForm.ex_type == 'timing') {
				this.finishTime = timestampToTime(new Date(this.replyForm.ex_time).getTime() + yanshi * 1000, 0,
					13);
			}
		},
		//保存任务开始
		funSaveFaDanTiming(action = 'Y') {
			var that = this;
			this.replyForm.action = action;
			//检查是否选择发单方案 ,填写任务名称  选择执行周期 执行时间
			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			if (that.replyForm.name == '') {
				const currentDate = new Date();
				const year = currentDate.getFullYear();
				const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始
				const day = String(currentDate.getDate()).padStart(2, '0');
				const hours = String(currentDate.getHours()).padStart(2, '0');
				const minutes = String(currentDate.getMinutes()).padStart(2, '0');
				const seconds = String(currentDate.getSeconds()).padStart(2, '0');
				const formattedTime = `${year}${month}${day}${hours}${minutes}${seconds}任务`;
				that.replyForm.name = formattedTime;
				// that.$message({
				// 	message: "请填写任务名称",
				// 	type: 'error',
				// 	offset: 200,
				// 	duration:1750,
				// });
			}
			if (that.replyForm.ex_type == "" || that.replyForm.ex_type == null) {
				that.$message({
					message: "请选择执行方式",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			if (that.replyForm.ex_time == '') {
				if (that.replyForm.ex_type == 'timing') {
					that.$message({
						message: "请选择定时发送时间",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				} else if (that.replyForm.ex_type == 'day') {
					that.$message({
						message: "请选择每天发送时间",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				} else if (that.replyForm.ex_type == 'now') {
					//that.$message({ message: "请选择每天发送时间" , type: 'error', offset: 300 });
					//return ;
				} else {
					that.$message({
						message: "请选择发送时间",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
			}else{
				if(that.replyForm.ex_type != 'now' && new Date(that.replyForm.ex_time).getTime() < new Date().getTime()){
					that.$message({
						message: "任务执行时间不能早于当前时间",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
			}
			if (that.replyForm.msg.length == 0) {
				that.$message({
					message: "请加入消息预览",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			if(that.replyForm.ex_type == "now" && that.needTipsCDN){
				let needReUpload = 0;
				that.replyForm.msg.forEach(item=>{
					if(item.jisu_stuatus != "就绪" && item.jisu_stuatus || item.jisu_stuatus_qy != "就绪" && item.jisu_stuatus_qy){
						needReUpload ++;
					}
				})
				if(needReUpload > 0){
					that.$message({
						message: "请点击“一键重传素材”重新上传该任务中所有图片、视频、文件等资源",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
			}
			that.saveFaDanTask();
		},
		// 保存发单任务
		saveFaDanTask() {
			var that = this;
			that.loading = true;
			//: 跟进选择得发单方案获取包含得机器人类型（gr_b qy） 用来检测所有素材是否已经就绪
			$.post('/wx/FaDanTiming/getFaDanRobotType', {
				fangan_ids: that.replyForm.fangan_sel
			}, function(json) {
				if (json.code == 200) {
					var robot_types = json.data;
					let not_ready = [];
					let not_ready_qy = [];
					robot_types.forEach(item => {
						that.replyForm.msg.forEach((msg_item,index) => {
							if (msg_item.msg_type_reply == 'img' || msg_item.msg_type_reply == 'shipin' || msg_item.msg_type_reply == 'gif') {
								if (item == 'qy') {
									if (msg_item.jisu_stuatus_qy != '就绪') {
										not_ready_qy.push(index+1);
									}
								} else if (item == 'gr_b') {
									if (msg_item.jisu_stuatus != '就绪') {
										not_ready.push(index+1);
									}
								}
							}
						})
					});
					if (not_ready.length > 0 || not_ready_qy.length > 0) {
						let message = `${not_ready.length>0?'个微':'企微'}极速存在未就绪素材，请确认所选方案机器人和素材上传状态`;
						if(that.saveError>0){
							message = `
								<p style="line-height: 20px;font-size: 13px;">
								${not_ready.length>0?'个微':'企微'}极速存在未就绪素材，请确认所选方案机器人和素材上传状态<br />
								若元素已处于就绪状态请尝试重传或 <span onclick="copyErrorMessageData('${robot_types}')" style="color: #409EFF;cursor: pointer;">下载本次数据</span> 联系客服<br />
								【出错位置：第${not_ready.length>0?not_ready.join('，'):not_ready_qy.join('，')}个】
								</p>
							`
						}
						that.$message({
							message: message,
							dangerouslyUseHTMLString: true,
							type: 'error',
							offset: 200,
							duration: 1750,
						});
						that.loading = false;
						that.saveError += 1;
						return false;
					}
					// else if () {
					// 	that.loading = false;
					// 	that.$message({
					// 		// message: "企微极速存在未就绪素材，请确认所选方案机器人和素材上传状态",
					// 		message: `
					// 			<p style="line-height: 20px;font-size: 13px;">
					// 			企微极速存在未就绪素材，请确认所选方案机器人和素材上传状态<br />
					// 			若元素已出于就绪状态请尝试重传或 <span onclick="copyErrorMessageData('${robot_types}')" style="color: #409EFF;cursor: pointer;">下载本次数据</span><br />
					// 			【出错位置：第${not_ready_qy.join('，')}个】
					// 			</p>
					// 		`,
					// 		dangerouslyUseHTMLString: true,
					// 		type: 'error',
					// 		offset: 200,
					// 		duration:1750,
					// 	});
					// 	return false;
					// }
					that.loading = false;
					var msg = "";
					let ex_status = "确定保存并<span style='color:#67c23a;'>执行</span>吗？";
					if (that.replyForm.action == 'N') {
						ex_status = "确定保存并<span style='color:#e6a23c;'>终止</span>吗？";
					}
					if (that.replyForm.ex_type == 'timing') {
						msg = "当前任务将于【" + that.replyForm.ex_time + "】 执行发送，" + ex_status;
					} else if(that.replyForm.ex_type == 'timing_week'){
						msg = "当前任务将于【本周的" + that.convertDayWeek(that.replyForm.ex_day_week)+'的' + that.replyForm.ex_time + "】 执行发送，" + ex_status;
					}else if (that.replyForm.ex_type == 'day') {
						msg = "当前任务将于【每天" + that.replyForm.ex_time + "】 执行发送，" + ex_status;
						if(that.replyForm.ex_day_week.length > 0  && that.replyForm.ex_day_week.length < 6){
							msg = "当前任务将于【每周的" + that.convertDayWeek(that.replyForm.ex_day_week)+'的' + that.replyForm.ex_time + "】 执行发送，" + ex_status;
						}
					} else if (that.replyForm.ex_type == 'now') {
						msg = "当前任务将于【5秒后】 执行发送，" + ex_status;
					} else if (that.replyForm.ex_type == 'month') {
						msg = "当前任务将于【每月的" + that.replyForm.ex_day_month.join(',') + "日" + that.replyForm.ex_time + "】 执行发送，" + ex_status;
					}

					that.$confirm(msg, '提示', {
						confirmButtonText: '确定',
						cancelButtonText: '取消',
						dangerouslyUseHTMLString: true,
						type: 'warning'
					}).then(() => {
						that.loading = true;
						that.replyForm.minute = that.zidingyi_timer
						that.getHuanTimer(2)
						// let data = JSON.parse(JSON.stringify(that.replyForm))
						const dataClone = deepClone(that.replyForm);
						// 处理小程序类型
						dataClone.msg.map(item => {
							if(item.msg_type_reply == 'xiaochengxu') {
								// item.is_new_data = 'Y'
								// item['geren'] = {
								// 	msg: item.geren,
								// 	is_new_data: 'Y'
								// }
								// item['qiye'] = {
								// 	msg: item.qiye,
								// 	is_new_data: 'Y'
								// }
								// item.is_new_data = 'Y'

								item.msg ={
									qiye: item.qiye,
									geren: item.geren,
									is_new_data: 'Y'
								}
							}
						})
						console.log('dataClone', dataClone);
						// data.msg.forEach(item=>{
						// 	delete item.img_src
						// })
						// dataClone.robot_group
						// 此处需要进行修改,拿机器人的id做key,选择的所有群聊数组做值
						// filteredFadanRobotList wxid: key
						dataClone.robot_group = that.getSelectedGroups
						dataClone['reissue_type'] = that.needFadanRobotGroup
						console.log('dataClone', dataClone);
						// return

						$.post('/wx/FaDanTiming/saveFaDanTiming', dataClone, function(
						json) {
							that.loading = false;
							if (json.code == 200) {
								that.addFadanTimingDialog = false;
								if(that.needTipsCDN){
									that.needTipsCDN = false;
								}
								that.getFaDanTimingList();
								that.$message({
									message: json.msg,
									type: 'success',
									offset: 200,
									duration:1750,
								})
								that.getHuanTimer()

								//设置时间保存
								const cloneData = JSON.parse(JSON.stringify(that.replyForm));
								// 拆分存储本次的执行方式和对应的执行时间
								function splitTimeObj() {
									const objResult = {}
									if (cloneData.ex_type != 'timing') {
										objResult['ex_type'] = cloneData.ex_type
										objResult['zidingyi_timer'] = cloneData.zidingyi_timer
										if (cloneData.ex_type == 'timing_week' || cloneData.ex_type == 'day' || cloneData.ex_type == 'month') {
											objResult['ex_time'] = cloneData.ex_time
										}

										if (cloneData.ex_type == 'timing_week') {
											objResult['ex_day_week'] = cloneData.ex_day_week
										}
										if (cloneData.ex_type == 'day') {
											objResult['ex_day_week'] = cloneData.ex_day_week
										}
										if (cloneData.ex_type == 'month') {
											objResult['ex_day_month'] = cloneData.ex_day_month
										}
									}
									return objResult
								}
								localStorage.setItem('implPlanTime', JSON.stringify(splitTimeObj()));

								// 设置方案存储,存储方案分组,所选发单方案
								localStorage.setItem('fainfo', JSON.stringify({
									fanganSel: that.replyForm.fangan_sel,
									// fanganGroup: that.fadan_group,
								}));

							} else {
								that.$message({
									message: json.msg,
									type: 'error',
									offset: 200,
									duration:1750,
								})
							}
						});

					}).catch(() => {
						//取消
					});
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					});
					that.loading = false;

					return false;
				}
			});
		},
		// 周天转换
		convertDayWeek(arr) {
			const dayMapping = {
				1: '周一',
				2: '周二',
				3: '周三',
				4: '周四',
				5: '周五',
				6: '周六',
				7: '周日'
			};
			return arr.map(day => dayMapping[day]).join(', ');
		},
		// 获取今天是周几
		getTodayWeekday(){
			var that = this;
			const date = new Date();
			const day = date.getDay();
			that.zhou_day = day === 0 ? 7 : day;
		},
		//删除预览
		delReplyMsg(item_msg) {

			var index = this.replyForm.msg.indexOf(item_msg)
			this.replyForm.msg.splice(index, 1);

			if (index == this.replyForm.msg.length) {
				this.editReplyMsg(index - 1);

			}

			if (this.replyForm.msg.length == 0) {
				// 如果没有内容了，则取消编辑
				this.closeEditReplyMsg();
			}

		},
		//加入预览图片
		addViewMsg(reply_msg) {
			var that = this;
			if ((that.reply_msg.msg == '' && reply_msg.msg_type_reply != 'xiaochengxu') ||
				(reply_msg.msg_type_reply == 'xiaochengxu' &&
					(!that.reply_msg.geren && !that.reply_msg.qiye)
				)
			) {
				that.$message({
					message: "请输入消息内容",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			if (that.reply_msg.msg_type_reply == 'card') {
				if (!that.reply_msg.title) {
					that.$message({
						message: "卡片标题不能为空",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
				if (!that.reply_msg.desc) {
					that.$message({
						message: "卡片描述不能为空",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
				if (!that.reply_msg.url) {
					that.$message({
						message: "卡片链接不能为空",
						type: 'error',
						offset: 200,
						duration:1750,
					});
					return;
				}
			}
			that.reply_msg.yanshi = that.default_yanshi;
			that.reply_msg.showContent = true;
			that.replyForm.msg.push(that.reply_msg);
			console.log('reply_msg', that.reply_msg);
			// 计算预计执行时间
			let yanshi = 0;
			that.replyForm.msg.forEach((item, index) => {
				yanshi = yanshi + Number(item.yanshi);
			})
			let executeWay = that.replyForm.ex_type;
			if (executeWay == 'now') {
				that.finishTime = timestampToTime(new Date().getTime() + yanshi * 1000, 0, 13);
			} else if ((executeWay == 'day' || executeWay == 'timing_week')&& that.replyForm.ex_time) {
				let time = new Date().getFullYear() + '-' + (new Date().getMonth() + 1 >= 10 ? new Date()
					.getMonth() + 1 : '0' + (new Date().getMonth() + 1)) + '-' + (new Date().getDate() >=
					10 ? new Date().getDate() : '0' + new Date().getDate());
				that.finishTime = timestampToTime(new Date(time + ' ' + that.replyForm.ex_time).getTime() +
					yanshi * 1000, 0, 13);
			} else if (executeWay == 'timing' && that.replyForm.ex_time) {
				that.finishTime = timestampToTime(new Date(that.replyForm.ex_time).getTime() + yanshi * 1000, 0,
					13);
			}

			//清空内容
			that.reply_msg = {
				sort: 0,
				msg_type_reply: 'txt',
				yanshi: that.default_yanshi,
				msg: "",
				img_src: '',
				title: '',
				url: '',
				desc: '',
				file_size: 0,
			};
			console.log('ex_timesss', that.reply_msg)
            that.asyncParatextContent();
			// console.log(that.reply_msg.msg)
		},
		//关键词回复类型改变
		replyTypeChange(val, reply_msg) {
			var that = this;
			console.log('val', val, this.reply_msg_tmp.msg_type_reply);
			if(this.replyForm.msg.length && val == this.reply_msg_tmp.msg_type_reply){
				this.paratextDom.echoContent(this.reply_msg_tmp.msg)
				this.reply_msg.msg = this.reply_msg_tmp.msg;
				this.reply_msg.xcxData = this.reply_msg_tmp.xcxData;
				this.reply_msg.sphData = this.reply_msg_tmp.sphData;
				this.reply_msg.img_src_video = this.reply_msg_tmp.img_src_video;
				this.reply_msg.img_src = this.reply_msg_tmp.img_src;
				this.reply_msg.file_size = this.reply_msg_tmp.file_size;
				console.log('reply_msg_tmp:::::::::',this.reply_msg,)
			}else{
				this.paratextDom.echoContent('')
				this.reply_msg.msg = '';
				this.reply_msg.xcxData = '';
				this.reply_msg.sphData = '';
				this.reply_msg.img_src_video = '';
				this.reply_msg.img_src = '';
				this.reply_msg.file_size = 0;
			}
			// console.msg(that.reply_msg);
			// console.log(val, replymsg_index, reply_msg,replymsg_index_top)

			//reply_msg.mini_pro_title = "";
			//reply_msg.mini_pro_logo = "";
			//if(val == "txt"){

			//}
			// if (val == "minipro") {
			//     that.rule_type = "reply";
			//     that.cur_reply_msg_index = replymsg_index;
			//     that.funSelMiniPro();
			// }
		},
		// 表情图
		handleItem(cur_item) {
			console.log('cur_item', cur_item);
			var that = this;


			that.gif_active_cur = cur_item;
			if (cur_item == 'keai') {
				that.gifList = that.gifList_keai;
			} else if (cur_item == 'gaoguai') {
				that.gifList = that.gifList_gaoguai;
			} else if (cur_item == 'chaiquan') {
				that.gifList = that.gifList_chaiquan;
			} else if (cur_item == 'yaoyiyao') {
				that.gifList = that.gifList_yaoyiyao;
			} else if (cur_item == 'anzhongguancha') {
				that.gifList = that.gifList_anzhongguancha;
			} else if (cur_item == 'woyao') {
				that.gifList = that.gifList_woyao;
			} else if (cur_item == 'zai') {
				that.gifList = that.gifList_zai;
			} else if (cur_item == 'dianzan') {
				that.gifList = that.gifList_dianzan;
			} else if (cur_item == 'jushou') {
				that.gifList = that.gifList_jushou;
			} else if (cur_item == 'wolaile') {
				that.gifList = that.gifList_wolaile;
			} else {
				that.gifList = [];
			}
			console.log(that.gifList)
		},
		setGif(event, item) {
			var that = this;
			if(that.$refs.emoticon.$refs.popper.style.display != 'none'){
				that.$refs.emoticon.doToggle();
			}
			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			if (typeof(that.$refs.biaoqing) != "undefined" && typeof(that.$refs.biaoqing[0]) != "undefined") {
				that.$refs.biaoqing.forEach(item => {
					item.visible = false;
				})
			}
			item.msg = event;
			item.img_src = that.oss_host + event;
			console.log('msg_item', event, item);
			//this.form.bank = this.gifList[Number(item) - 1].name;
			that.exUploadCDN();
			//清空表情选择项
			that.radio = "";
		},

		//表情图
		setEmo_area_reply(emo, replymsg) {
			var that = this;
			var msg = replymsg.msg;
			let str = msg;
			let input_index = that.blur_index_area_reply;
			if (input_index >= 0) {
				replymsg.msg = str.slice(0, input_index) + "[" + emo + "]" + str.slice(input_index);
				that.blur_index_area_reply = input_index + ("[" + emo + "]").length;
			} else {
				replymsg.msg = str + "[" + emo + "]";
			}
		},
		check_number(val, min) {
			var that = this;
			if (val < min) {
				that.$message({
					message: "必须是大于等于" + min + "整数!",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
		},
		beforeAvatarUpload(file) {
			var that = this;

			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}

			that.load = layer.load();
			const isJPG = file.type === 'image/jpeg';
			const isPng = file.type === 'image/png';
			const isGif = file.type === 'image/gif';
			const isLt2M = file.size / 1024 / 1024 < 2;
			if (!isJPG && !isPng && !isGif) {
				layer.close(that.load);
				that.$message({
					message: '上传图片只能是 JPG、PNG、GIF 格式!',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			if (!isLt2M) {
				layer.close(that.load);
				that.$message({
					message: '上传图片大小不能超过 2MB!',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			return (isJPG || isPng || isGif) && isLt2M;
		},

		//粘贴图片
		tlj_product_img_paste(p_index, replymsg_index, c_index = null) {
			var that = this;
			that.isshowv = !that.isshowv;

			document.addEventListener("paste", (function(e) {
				if (event.clipboardData || event.originalEvent) {
					const clipboardData = (event.clipboardData || event.originalEvent
					.clipboardData);
					if (clipboardData.items) {
						let blob;
						for (let i = 0; i < clipboardData.items.length; i++) {
							if (clipboardData.items[i].type.indexOf('image') !== -1) {
								blob = clipboardData.items[i].getAsFile();
							}
						}
						// 生成文件对象
						const filer = new FileReader()
						// 将获取的粘贴数据转成 URL格式的字符串（base64编码）
						filer.readAsDataURL(blob)
						that.load = layer.load()
						// 这个回调在 filer.readAsDataURL(blob) 的时候触发
						filer.onload = (e) => {
							// 获取URL格式的字符串 Base64编码
							const base64 = e.target.result;
							that.base64img(base64, p_index, replymsg_index, c_index)
						};
					}
				}
				that.isshowv = false
				document.removeEventListener(event.type, arguments.callee, !1)
			}))
		},

		//上传图片
		base64img(url, p_index, replymsg_index, c_index) {
			var that = this;
			//console.log(url)
			$.ajax({
				type: "post",
				url: "/wx/FenWei_rw/uploadImgBase64",
				data: {
					"base64_pic": url,
					path: 'PaiDan',
					p_index: p_index,
					replymsg_index: replymsg_index,
					c_index: c_index
				}, // url.split(",")[1]
				async: false,
				success: function(res) {
					if (res.code == 200) {
						var img_data = res.data;
						that.afterUpimg_new(img_data);
						//有图片需要在这里提前触发上传CDN
						that.exUploadCDN();
						layer.close(that.load);
					} else {
						layer.close(that.load);
					}

				}
			})
		},
		//图片预览
		imgPreview(imgurl, type) {
			if(type == 'file'){
				window.open(imgurl)
				return
			}
			var that = this,
				html;
			if (type == 'video') {
				html = '<video src="' + imgurl + '" controls style="width: 100%;"></video>';
			} else {
				html = '<img src="' + imgurl + '" id="copyimg" style="width: 100%;"   />';
			}
			layer.open({
				type: 1, //Page层类型  为1显示本地类容   为2显示在线内容，也就是图片链接
				title: false,
				closeBtn: 1, //0不显示关闭按钮 1显示
				shadeClose: true, //开启遮罩关闭
				area: '350px', //弹框的宽高
				offset: '200px',
				content: html //内容
			});
		},
		beforeAvatarUpload_file(file){
			var that = this;
			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			that.load = layer.load();
			if(['video/mp4','video/mp4','image/jpeg','image/png','image/gif'].includes(file.type)){
				layer.close(that.load);
				that.$message({
					message: "请选择其他文件格式上传!",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false
			}
			if ((file.size / 1024 / 1024) > 10) {
				layer.close(that.load);
				that.$message({
					message: '上传文件大小不能超过 10MB!',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false
			}
		},
		beforeAvatarUpload_video(file) {
			var that = this;
			if (that.replyForm.fangan_sel.length == 0) {
				that.$message({
					message: "请选择发单方案",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			that.load = layer.load();
			const isMp4 = file.type === 'video/mp4';
			const isFlv = file.type === 'video/flv';
			const isLt5M = file.size / 1024 / 1024 < 10;
			if (!isMp4 && !isFlv) {
				layer.close(that.load);
				that.$message({
					message: '上传视频只能是 mp4、flv 格式!',
					type: 'error',
					offset: 200,
					duration:1750,
				});
			}
			if (!isLt5M) {
				layer.close(that.load);
				that.$message({
					message: '上传视频大小不能超过 10MB!',
					type: 'error',
					offset: 200,
					duration:1750,
				});
			}
			return (isMp4 || isFlv) && isLt5M;
		},

		/*图片上传*/
		handleAvatarSuccess_reply(res, file) {
			var that = this;
			layer.close(that.load);
			if (res.code == '200') {
				var img_data = res.data;
				that.afterUpimg_new(img_data);

				//极速发送的时候检查右侧剧本里面有没有图片,有图片需要在这里提前触发上传CDN
				if (that.reply_msg.msg_type_reply != 'card') {
					that.exUploadCDN();
				}
			} else {
				that.$message({
					message: res.msg,
					type: 'error',
					offset: 200,
					duration:1750,
				})
			}
			// this.imageUrl = URL.createObjectURL(file.raw);
		},
		afterUpimg_new(img_data) {
			var that = this;
			that.reply_msg.img_src = img_data['show_path'];
			that.reply_msg.msg = img_data['save_path'];
			that.reply_msg.file_size = parseInt(parseInt(img_data['file_size']) / 1024);
			if (img_data['file_type'] == 'video') {
				that.reply_msg.img_src_video = img_data['show_path'].split('?')[0] +
					"?x-oss-process=video/snapshot,t_10000,m_fast";
			}
			if(img_data['file_type'] == 'file') that.reply_msg.title = img_data['old_name'];
			console.log(that.reply_msg)
			//重新设置一下 来实现数据重新绑定更新视图 start
			// var yanshi_tmp = that.replyForm.msg[replymsg_index_top].msg[replymsg_index].yanshi;
			// that.replyForm.msg[replymsg_index_top].msg[replymsg_index].yanshi = 0;
			// that.replyForm.msg[replymsg_index_top].msg[replymsg_index].yanshi = yanshi_tmp;
			//重新设置一下 来实现数据重新绑定更新视图 end
		},

		isXML(str) {
			if ((str.startsWith('<?xml') || str.startsWith('<!DOCTYPE')) && str.includes('<')) {
				try {
					new DOMParser().parseFromString(str, 'text/xml');
					return true;
				} catch (e) {
					return false;
				}
			}
			return false;
		},
		//检查是不是指复制了code
		isAlphanumeric(str) {
			if(!str) return false;
			var letterNumber = /^[0-9a-zA-Z]+$/;
			if (str.length === 6 && letterNumber.test(str)) {
				return true;
			} else {
				return false;
			}
		},
		getChatInfo(reply_msg) {
			var that = this;
			if (reply_msg.msg == '') {
				return false;
			}
			if (that.isAlphanumeric(reply_msg.msg)) {
				reply_msg.msg = "";
				that.$message({
					message: '请复制整行内容',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			if (!reply_msg.msg.includes("复制我去粘贴")) {
				if (reply_msg) {
					that.getPrevieweData(reply_msg);
				}
				return false;
			}
			$.post('/wx/CircleFriends/getChatInfo', {
				cacheCode: reply_msg.msg
			}, function(json) {
				if (json.code == 200) {
					if(json.data.msg){
						reply_msg.msg = json.data.msg;
						reply_msg.msg_title = json.data.title;
						reply_msg.msg_desc = json.data.desc;
					}
					that.getPrevieweData(reply_msg);
				} else {
					reply_msg.msg = "";
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					});
				}
			}, "json");
		},
		//获取缓存中的视频号cnd信息
		getCdnInfo(reply_msg, type) {
			const that = this;

			// 确定要检查和可能需要修改的消息内容
			let messageField = '';
			if (type == 'geren') {
				messageField = 'geren';
			} else if (type == 'qiye') {
				messageField = 'qiye';
			} else {
				messageField = 'msg';
			}

			// 检查必要字段是否存在
			if ((type == 'geren' && !reply_msg.geren) ||
				(type == 'qiye' && !reply_msg.qiye) ||
				(type == 'note' && !reply_msg.msg) ||
				(!type && !reply_msg.msg)) {
				return false;
			}

			console.log(reply_msg, '======reply_msg======1');

			// 检查是否只复制了验证码
			if ((reply_msg[messageField] && that.isAlphanumeric(reply_msg[messageField]) &&
				(type == 'geren' || type == 'qiye' || (type != 'xiaochengxu' && type != 'shipinhao')))) {
				reply_msg[messageField] = "";
				that.$message({
					message: '请复制整行内容',
					type: 'error',
					offset: 200,
					duration: 1750,
				});
				return false;
			}

			console.log(reply_msg, '======reply_msg======2');

			// 检查内容中是否不含有"复制我去粘贴"
			if ((reply_msg[messageField] && !reply_msg[messageField].includes("复制我去粘贴") &&
				(type == 'geren' || type == 'qiye' || type == 'shipinhao' || type == 'note'))) {
				if (reply_msg) {
					that.getPrevieweData(reply_msg, type);
				}
				return false;
			}

			// 获取缓存代码
			let cacheCode = reply_msg[messageField];

			// 发起请求获取CDN信息
			$.post('/wx/CircleFriends/getCdnInfo', {
				cacheCode,
			}, function(json) {
				if (json.code == 200) {
					reply_msg[messageField] = json.data;
					console.log('json', '=====reply_msg json=====', reply_msg);
					that.getPrevieweData(reply_msg, type);
				} else {
					reply_msg[messageField] = "";
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration: 1750,
					});
				}
			}, "json");
		},
		getPrevieweData(reply_msg, type) {
			const that = this;

			// 根据不同类型获取消息内容
			let msgContent;
			if (type === 'qiye') msgContent = reply_msg.qiye;
			else if (type === 'geren') msgContent = reply_msg.geren;
			else msgContent = reply_msg.msg;

			// 如果没有内容，直接返回
			if (!msgContent) return;

			// 先尝试 JSON 解析
			try {
				let json = JSON.parse(msgContent);

				if (reply_msg.msg_type_reply === "xiaochengxu") {
					that.$set(reply_msg, "xcxData", {
						name: json.appname,
						title: json.title,
						appicon: json.appicon,
						media: '',
					});
				} else if (reply_msg.msg_type_reply === 'shipinhao') {
					that.$set(reply_msg, "sphData", {
						name: json.nickname,
						title: json.desc,
						appicon: json.avatar,
						media: json.cover_url,
					});
				}
			} catch (e) {
				// JSON 解析失败，尝试 XML 解析
				try {
					// 处理可能没有XML声明的情况
					const hasXmlDeclaration = msgContent.trim().startsWith('<?xml');
					const xmlContent = hasXmlDeclaration ? msgContent : `<?xml version="1.0"?>${msgContent}`;

					var x2js = new X2JS();
					let jsonObj = x2js.xml_str2json(xmlContent);

					if (!jsonObj || !jsonObj.msg) return;

					// 处理小程序类型
					if (reply_msg.msg_type_reply === "xiaochengxu" && jsonObj.msg.appmsg && jsonObj.msg.appmsg.weappinfo) {
						that.$set(reply_msg, "xcxData", {
							name: jsonObj.msg.appmsg.sourcedisplayname || '',
							title: jsonObj.msg.appmsg.title || '',
							appicon: jsonObj.msg.appmsg.weappinfo.weappiconurl || '',
							media: '',
						});
						return;
					}

					// 处理笔记类型 - 简化后只读取des字段
					if (reply_msg.msg_type_reply === 'note' && jsonObj.msg.appmsg) {
						const noteData = {
							name: '',
							title: '',
							appicon: '',
							media: '',
						};

						// 只获取des字段的值
						if (jsonObj.msg.appmsg.des) {
							noteData.title = jsonObj.msg.appmsg.des;
						}

						that.$set(reply_msg, "noteData", noteData);
						return;
					}

					// 处理视频号等其他类型
					if (jsonObj.msg.appmsg && jsonObj.msg.appmsg.finderFeed) {
						const feed = jsonObj.msg.appmsg.finderFeed;
						let coverUrl = '';

						// 提取封面URL
						if (feed.mediaList && feed.mediaList.media) {
							const media = feed.mediaList.media;

							if (media.coverUrl && media.coverUrl.__cdata) {
								coverUrl = media.coverUrl.__cdata;
							} else if (media.thumbUrl && media.thumbUrl.__cdata) {
								coverUrl = media.thumbUrl.__cdata;
							} else {
								const isMediaArray = Array.isArray(media);

								if (!isMediaArray && media.fullCoverUrl) {
									coverUrl = media.fullCoverUrl;
								} else if (!isMediaArray && media.thumbUrl) {
									coverUrl = media.thumbUrl;
								} else if (isMediaArray && media[0] && media[0].thumbUrl) {
									coverUrl = media[0].thumbUrl;
								}
							}
						}

						that.$set(reply_msg, "sphData", {
							name: feed.nickname || '',
							title: feed.desc || '',
							appicon: feed.avatar || '',
							media: coverUrl
						});
					}
				} catch (xmlError) {
					console.error("XML parsing error:", xmlError);
				}
			}
		},
		//输入发单内容光标位置
		txtBlurArea_reply(e) {
			this.blur_index_area_reply = e.srcElement.selectionStart;
		},
		//选择发单方案
		funFanganChange(val) { // val 是当前选中的方案 ID 数组
			// 如果选了补发群 (needFadanRobotGroup == 1), 则只允许选择一个方案
			if (this.needFadanRobotGroup == 1) {
				if (val && val.length > 0) {
					// 获取最新选择的方案 (数组最后一个元素)
					const latestSelection = val[val.length - 1];
					// 将 fangan_sel 设置为只包含最新选择方案的数组
					this.$nextTick(() => {
						this.$set(this.replyForm, 'fangan_sel', [latestSelection]);
					});
				} else {
					// 如果没有选择（例如取消了最后一个选择），则清空数组
					this.$set(this.replyForm, 'fangan_sel', []);
				}
			} else {
				// 如果不是补发群模式 (needFadanRobotGroup == 0)，则允许多选，直接赋值
				this.$set(this.replyForm, 'fangan_sel', val);
			}
			this.faDanSelClear()
		},
		//关闭添加窗口
		addFadanTimingDialogClose() {
			var that = this;
			that.saveError = 0;
			that.isshowv = false;
			that.addFadanTimingDialog = false;
			that.reply_msg_index = '';
			that.replyForm = {
				ex_type: 'timing',
				ex_time: '',
				name: '',
				fangan_sel: [],
				msg: [], //发送消息列表
				ex_day_week:[],
			};
			//清空内容
			that.reply_msg = {
				sort: 0,
				msg_type_reply: 'txt',
				yanshi: that.default_yanshi,
				msg: "",
				img_src: '',
				title: '',
				url: '',
				desc: '',
				file_size: 0,
				// 重置个人和企业字段数据
				qiye: '',
				geren: '',
			};

			// 清除补发
			that.needFadanRobotGroup = 0;
			// 清除选择的补发群
			that.selectedGroups = [];
			that.isEditMode = false;
			that.fadanRobotList = []
			that.groupListDataByRobotWxid = []
			that.fadanRobotList = []

			that.$forceUpdate();
			that.finishTime = '';
			that.asyncParatextContent();
			if (this.$refs.groupTable) this.$refs.groupTable.clearSelection()
		},
		//添加定时发单
		addFadanTiming() {
			var that = this;
			that.job_id = "";
			that.fold = false;
			that.operateStatus = 'add';
			that.addFadanTimingDialog = true;
			that.bianji = 1
			that.replyFormWeekHuancun ={   //暂存发单详情里的日期
				type:'',
				list:[]
			};
			// that.replyForm.ex_time = localStorage.getItem('minuteTimer')
			that.addCacheTimer()
			// 获取缓存方案信息
			const fainfo = localStorage.getItem('fainfo') && JSON.parse(localStorage.getItem('fainfo'));
			console.log(fainfo);
			if (fainfo) {
				this.replyForm.fangan_sel = fainfo.fanganSel
				// this.$nextTick(() => {
				// this.select_group = fainfo.fanganGroup
				// })
			}
		},
		//缓存的时间
		addCacheTimer(){
			var that = this
			// 获取当前时间
				var nowTimer = new Date().getTime() / 1000
				var prevTimer = Number(localStorage.getItem('prevTimer'))
			var minuteTimer = Number(localStorage.getItem('minuteTimer'))


			// that.jiange_timer = Math.round(minuteTimer / 60)
				var setTimer = ''
				// 检查有没有缓存时间
				// 如果本地存储中有之前设置的高级设置时间值
				if(localStorage.getItem('prevTimer')){
					// 获取高级设置的分钟数
					const intervalMinutes = prevTimer;
					let targetTime;

					// 判断上次设置时间与当前时间的关系
					if(nowTimer < minuteTimer){
						// 如果上次时间大于当前时间,则该时间为"上次设置时间" + "高级设置时间",<br/>
						targetTime = minuteTimer + (intervalMinutes * 60);
					} else {
						// 如果上次设置时间小于当前时间,则该时间为"当前时间"+"高级设置时间"
						targetTime = nowTimer + (intervalMinutes * 60);
					}

					// 更新表单中的执行时间
					that.replyForm.ex_time = timestampToTime(targetTime, 3, 10);
					// 保存高级设置的分钟数到表单
					that.zidingyi_timer = intervalMinutes;

				}
		},
		// 批量终止任务
		switchFadanTimingBatch() {
			var that = this;
			if (that.multipleSelection.length == 0) {
				that.$message({
					message: "请至少选择一个任务后再终止",
					type: 'error',
					offset: 300,
					duration:1750,
				});
				return false;
			}
			var ids = [];
			that.multipleSelection.forEach(item => {
				ids.push(item.id);
			})
			that.funSwitch(ids, 'N');

		},
		//开启/关闭
		funSwitch(id, action = 'N', row = '') {
			this.yinyong = id;
			var that = this;
			this.msg = "确定要终止当前定时任务吗";
			var is_do = true;
			if (action == 'Y') {
				this.msg = "可设置从某一条内容开始发送，默认从第1条开始执行";
				if (row != '' && row.ex_type == 'timing') {
					//console.log(row);
					var ex_time = parseInt(row.ex_time) * 1000;
					var cur_time = Date.now();
					if (ex_time < cur_time) {
						is_do = false;
						that.$confirm('该任务已过期，请重新选择执行时间', '提示', {
							confirmButtonText: '确定',
							cancelButtonText: '取消',
							type: 'warning'
						}).then(() => {
							//执行编辑
							that.editFadanTiming(row, 'edit');
							return false;
						}).catch(() => {
							//取消
						});
					}
				}
				if (row != '' && row.ex_type == 'now') {
					// msg = '当前任务已执行, 开启后将重新发送, 是否确认开启?';
					this.msg = '当前任务已执行, 可设置从某一条内容开始发送，默认从第1条开始执行';
				}
				if (row != '' && row.ex_type == 'day') {
					this.msg = '重复执行的任务, 已过期的任务将更新至明天执行, 未过期的任务将在今天继续执行, 可设置从某一条内容开始发送,默认从第1条开始执行'
				}
			}
			if (is_do) {
				if (action == 'N') {
					that.$confirm(this.msg, '提示', {
						confirmButtonText: '确定',
						cancelButtonText: '取消',
						type: 'warning'
					}).then(() => {
						$.post('/wx/FaDanTiming/changeSwitch', {
							job_id: id,
							action: action
						}, function(json) {
							if (json.code == 200) {
								that.$message({
									message: json.msg,
									type: 'success',
									offset: 200,
									duration:1750,
								});
								that.getFaDanTimingList();
							} else {
								that.$message({
									message: json.msg,
									type: 'error',
									offset: 200,
									duration:1750,
								})
							}
						}, "json");
					}).catch(() => {
						//取消事件
					});
				} else {
					that.tipsFlag = true;
					that.tipsRow = row;
				}
			}
		},
		resetTips(){
			this.setNum = '1';
			this.tipsRow = {};
			this.msg = '';
			this.disposable = "0";
			this.exTime = "";
		},
		// 设置开始
		setStart(){
			let that = this;
			if(this.disposable == "1" && !this.exTime){
				this.exTime = timestampToTime(new Date().getTime(),0,13).replace(/\//g,'-');
			}
			if(this.setNum > this.tipsRow.msg_count){
				this.$message({
					message: '该任务共设置'+this.tipsRow.msg_count+'条内容供发送',
					type: 'error',
					offset: 200,
					duration:1750,
				})
				return;
			}
			$.post('/wx/FaDanTiming/changeSwitch', {
				job_id: this.tipsRow.id,
				action: "Y",
				num:this.setNum?this.setNum:'1',
				disposable:this.disposable,
				exTime:this.exTime,
			}, function(json) {
				if (json.code == 200) {
					that.$message({
						message: json.msg,
						type: 'success',
						offset: 200,
						duration:1750,
					});
					that.tipsFlag = false;
					that.getFaDanTimingList();
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}
			}, "json");
		},
		delFadanTimingBatch() {
			var that = this;
			if (that.multipleSelection.length == 0) {
				that.$message({
					message: "请至少选择一个任务后再删除",
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			var ids = [];
			that.multipleSelection.forEach(item => {
				ids.push(item.id);
			})
			that.delFadanTiming(ids);

		},
		//共享码克隆任务
		copyFadanTiming() {
			var that = this;
			this.$prompt('请输入共享码', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
			}).then(({
				value
			}) => {
				that.replyForm.share_code = value;
				that.copyByShareCode();
			}).catch(() => {
				// this.$message({
				//   type: 'info',
				//   message: '取消输入'
				// });
			});
		},
		//设置编辑数据
		sett_edit_data(row) {
			var that = this;
			//row=json.data;//重新赋值最新的数据
			// 进行时间修正
			if (row.ex_datetime.indexOf('20') == -1) {
				row.ex_datetime = '20' + row.ex_datetime;
			}
			if (row.msg == null) {
				that.$message({
					showClose: true,
					message: '消息处理未就绪，请检查机器人是否正常在线',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return;
			}
			let msg = JSON.parse(row.msg);
			console.log(row);
			that.replyForm = {
				ex_type: row.ex_type,
				ex_time: row.ex_datetime,
				name: row.name,
				fangan_sel: typeof(row.fangan_sel) != 'undefined' && row.fangan_sel != null ? row.fangan_sel
					.split(',') : [],
				msg: msg,
				id: row.id,
				ex_day_week:row.ex_day_week,
				ex_day_month:row.ex_day_month
			};
			that.replyFormWeekHuancun = {
				type:row.ex_type,
				list:row.ex_day_week
			};
			console.log('shuju',that.replyForm);
			that.addFadanTimingDialog = true;
			let resourceCount = 0,list = ['img','shipin','gif','file'];
			let flag = row.ex_type == 'now' && new Date().getTime() - Number(row.end_time + '000') >= 259200000;
			that.replyForm.msg.forEach((item, index) => {
				item.showContent = true;
				if(list.findIndex(line=>line == item.msg_type_reply) >= 0){
					resourceCount += 1;
					if(flag){
						item.jisu_stuatus = "未就绪";
						item.jisu_stuatus_qy = "未就绪";
					}
				}
				that.getPrevieweData(item);
			});
			if(resourceCount > 0){
				if(flag){
					that.needTipsCDN = true;
				}else{
					that.needTipsCDN = false;
				}
			}else{
				that.needTipsCDN = false;
			}
		},
		// 批量上传-筛选检测消息中未就的消息
		batchUpFileCDN() {
			var that = this;
			that.batchUpLoading = true;
			// 全部重置为准备中
			that.replyForm.msg = that.replyForm.msg.map((item, index) => ({
				...item,
				jisu_stuatus: (item.jisu_stuatus != '') ? '未就绪' : '',
				jisu_stuatus_qy: (item.jisu_stuatus_qy != '') ? '未就绪' : '',
			}));
			that.upFileCDN(0);
		},
		// 上传并检测
		upFileCDN(index) {
			let that = this;
			// 判断是否检测完成 / 弹框是否关闭，若弹框关闭停止上传/检测
			if (index >= that.replyForm.msg.length || !that.addFadanTimingDialog) {
				that.batchUpLoading = false;
				return
			}
			// 判断消息类型是否需要上传CDN
			let line = that.replyForm.msg[index];
			let needReload = ['img', 'shipin', 'gif', 'file'].includes(line.msg_type_reply)
			if (needReload) {
				// 上传之前先定义为准备中，告诉用户正在处理当前素材
				that.replyForm.msg[index].jisu_stuatus = (line.jisu_stuatus != '') ? '准备中' : '',
					that.replyForm.msg[index].jisu_stuatus_qy = (line.jisu_stuatus_qy != '') ? '准备中' : '',
					$.post('/wx/FaDanTiming/exUploadCDN', {
						is_upload: "Y",
						fangan_ids: that.replyForm.fangan_sel,
						types: [line.msg_type_reply],
						imgs: [line.msg]
					}, (res) => {
						if (res.code == 200) {
							console.log(res);
							res.data.map(item => {
								if (item.robot_type == 'qy') {
									that.replyForm.msg[index].jisu_stuatus_qy = '准备中';
									if (res.data.length == 1) {
										that.replyForm.msg[index].jisu_stuatus = ''
									};
								} else if (item.robot_type == 'gr_b') {
									that.replyForm.msg[index].jisu_stuatus = '准备中';
									if (res.data.length == 1) {
										that.replyForm.msg[index].jisu_stuatus_qy = ''
									};
								}
							})
							that.checkFileCDN(index, 0, res.data);
						} else {
							that.batchUpLoading = false
							that.$message({
								message: res.msg,
								type: 'error',
								offset: 200,
								duration:1750,
							})
						}
					}, "json");
			} else {
				that.upFileCDN(index + 1);
			}
		},
		checkFileCDN(index, checkNum, cache_key_arr) {
			var that = this;
			// 判断弹框是否关闭，若弹框关闭停止上传/检测
			if (!that.addFadanTimingDialog) {
				that.batchUpLoading = false;
				return
			}
			if (checkNum < 5) {
				$.post('/wx/FaDanTiming/checkImgCDN', {
					cache_key_arr: JSON.stringify(cache_key_arr)
				}, function(json) {
					console.log(json);
					if (json.code == 200) {
						let allY = true;
						json.data.forEach(item => {
							let robot_type = '',
								status = '';
							(item.key.indexOf('gr_b') >= 0) ? robot_type = 'gr_b': robot_type =
								'qy';
							if (item.value == 'Y') {
								status = '就绪'
							} else {
								allY = false;
								status = '准备中'
							};
							if (robot_type == 'qy') {
								that.replyForm.msg[index].jisu_stuatus_qy = status;
							} else if (robot_type == 'gr_b') {
								that.replyForm.msg[index].jisu_stuatus = status;
							}
						})
						// 如果当前校验数组全部通过，继续上传下一张，否则延迟一秒继续校验
						if (allY) {
							that.upFileCDN(index + 1);
						} else {
							setTimeout(function() {
								that.checkFileCDN(index, checkNum + 1, cache_key_arr);
							}, 1000)
						}
					} else {
						console.log(json.msg);
					}
				}, "json");
			} else {
				// 次数超过限制，展示未就绪，继续上传下一张
				cache_key_arr.forEach(item => {
					if (item.robot_type == 'qy') {
						that.replyForm.msg[index].jisu_stuatus_qy = '未就绪';
					} else if (item.robot_type == 'gr_b') {
						that.replyForm.msg[index].jisu_stuatus = '未就绪';
					}
				})
				that.upFileCDN(index + 1);
			}

		},
		//根据共享码复制发单任务
		copyByShareCode() {
			var that = this;
			var share_code = that.replyForm.share_code;
			if (share_code == '') {
				that.$message({
					message: '请输入共享码',
					type: 'error',
					offset: 200,
					duration:1750,
				});
				return false;
			}
			console.log('share_code', share_code);
			$.post('/wx/FaDanTiming/copyByShareCode', {
				share_code: share_code
			}, function(json) {
				if (json.code == 200) {
					that.$message({
						message: json.msg,
						type: 'success',
						offset: 200,
						duration: 1750
					});
					//设置编辑数据
					that.getFaDanTimingList();
					setTimeout(function() {
						that.sett_edit_data(json.data)
					}, 1750);
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}
			}, "json");
		},

		//复制共享码
		copyShareCode(id) {
			var that = this;
			$.post('/wx/FaDanTiming/copyShareCode', {
				job_id: id
			}, function(json) {
				if (json.code == 200) {
					// that.$message({ message: json.msg, type: 'success', offset: 300 });
					//执行复制共享码
					that.copy(json.data);
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}
			}, "json");
		},

		//删除定时发单
		delFadanTiming(id) {
			var that = this;
			that.$confirm('确定要删除当前任务吗，删除后无法恢复?', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				$.post('/wx/FaDanTiming/delFaDanTiming', {
					job_id: id
				}, function(json) {
					if (json.code == 200) {
						that.$message({
							message: json.msg,
							type: 'success',
							offset: 200,
							duration:1750,
						});
						that.getFaDanTimingList();
					} else {
						that.$message({
							message: json.msg,
							type: 'error',
							offset: 200,
							duration:1750,
						})
					}
				}, "json");
			}).catch(() => {
				//取消事件
			});
		},
		//编辑发单
		editFadanTiming(row, status) {
			const labelKey = arguments[1]['property']

			if(status == 'open'){
				this.reply_msg_index = 0;
			}
			var that = this;
			that.yinyong = row.id;
			that.bianji = 2
			that.job_id = "【" + row.id + "】";
			//:通过接口获取一次最新的数据 赋值到row 里面 确保 修改的数据为最新的
			$.post('/wx/FaDanTiming/getFaDanTimingRow', {
				id: row.id
			}, function(json) {
				if (json.code == 200) {
					row = json.data; //重新赋值最新的数据
					if(labelKey == 'sort') return
					// 进行时间修正
					if (row.ex_datetime.indexOf('20') != 0 ) {
						row.ex_datetime = '20' + row.ex_datetime;
					}
					if (row.msg == null) {
						that.$message({
							showClose: true,
							message: '消息处理未就绪，请检查机器人是否正常在线',
							type: 'error',
							offset: 200,
							duration:1750,
						});
						return;
					}
					let apiResultData = deepClone(json.data.msg)
					// console.log('apiResultData',apiResultData)
					let msg = JSON.parse(row.msg); // 尝试格式化数据
					let yanshi = 0; // 延迟时间
					msg.forEach((item, index) => { // 遍历消息
						yanshi = yanshi + Number(item.yanshi); // 计算延迟时间
					})
					that.replyForm = {
						ex_type: row.ex_type,
						ex_time: row.ex_datetime,
						name: row.name,
						msg: msg,
						id: row.id,
						ex_day_week:row.ex_day_week,
						ex_day_month:row.ex_day_month
					};
					console.log(that.replyForm,'===that.replyForm====');

					that.replyFormWeekHuancun = {
						type:row.ex_type,
						list:row.ex_day_week
					};
					(row.fangan_sel == null || row.fangan_sel == '') ? that.replyForm.fangan_sel = []:
						that.replyForm.fangan_sel = row.fangan_sel.split(',');
					that.addFadanTimingDialog = true;
					that.sett_edit_data(json.data);
					// row=json.data;//重新赋值最新的数据
					// // 进行时间修正
					// if (row.ex_datetime.indexOf('20') == -1) {
					//     row.ex_datetime = '20' + row.ex_datetime;
					// }
					// if (row.msg == null) {
					//   that.$message({ showClose: true, message: '消息处理未就绪，请检查机器人是否正常在线', type: 'error', offset: 300 });
					//   return;
					// }
					// that.replyForm={
					//   ex_type:row.ex_type,
					//   ex_time:row.ex_datetime,
					//   name: row.name,
					//   fangan_sel: typeof(row.fangan_sel)!='undefined'&&row.fangan_sel!=null?row.fangan_sel.split(','):[],
					//   msg: JSON.parse(row.msg),
					//   id:row.id,
					// };
					// that.addFadanTimingDialog=true;

					// 显示预计完成时间
					that.finishTime = row.yuji_time;
					// if (row.ex_type == 'timing') {
					// 	that.finishTime = timestampToTime(new Date(row.ex_datetime).getTime() + yanshi * 1000, 0, 13);
					// } else if (row.ex_type == 'day') {
					// 	let time = new Date().getFullYear() + '-' + (new Date().getMonth() + 1 >= 10 ? new Date().getMonth() + 1 : '0' + (new Date().getMonth() + 1)) + '-' + (new Date().getDate() >= 10 ? new Date().getDate() : '0' + new Date().getDate());
					// 	that.finishTime = timestampToTime(new Date(row.ex_datetime).getTime() + yanshi * 1000, 0, 13);
					// } else if (row.ex_type == 'now') {
					// 	that.finishTime = timestampToTime(new Date().getTime() + yanshi * 1000, 0, 13);
					// }
					that.needFadanRobotGroup = Number(row.reissue_type)
					that.isEditMode = true; // 设置为编辑模式
					if (!that.isEmptyObject(row.robot_group)) that.rowBackDataGroup(row.robot_group);
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}
			});
		},
		//执行搜索
		doSearch() {
			var that = this;
			// that.getFanganList();
			// that.fuGetRobotGrouplist();
			that.getFaDanTimingList();
		},
		//选择任务
		handleSelectionChange_job(val) {
			var that = this;
			that.multipleSelection = val;
		},
		//发单任务页码改变
		jobCurrentChange(val) {
			this.table_data.currPage = val;
			this.getFaDanTimingList();
		},
		//每页数量改变
		jobSizeChange(val) {
			this.table_data.size = val;
			this.table_data.currPage = 1;
			this.getFaDanTimingList();

		},

		//获取账号设置的采集号和发单号
		fuGetRobotGrouplist(is_msg = false) {
			var that = this;
			$.post('/wx/FaDan/getFadanRobotlist', {}, function(json) {
				if (json.code == 200) {
					if (json.data == '') {
						that.$confirm('定时发单、排单为发单助手的免费扩展功能，需先开通发单机器人并设置好发单方案后，才可正常使用定时发单、排单功能', '提示', {
							confirmButtonText: '去开通',
							cancelButtonText: '取消',
							type: 'warning'
						}).then(() => {
							//跳转页面去   /wx/FaDan
							window.open('/wx/FaDan', '_self');
						}).catch(() => {
							//取消事件
						});
					}
				} else {
					// 打开切换机器人
					that.$confirm('定时发单、排单为发单助手的免费扩展功能，需先开通发单机器人并设置好发单方案后，才可正常使用定时发单、排单功能', '提示', {
						confirmButtonText: '去开通',
						cancelButtonText: '取消',
						type: 'warning'
					}).then(() => {
						window.open('/wx/FaDan', '_self');
					}).catch(() => {
						//取消事件
					});

					// that.$message({ showClose: true, message: '暂无发单机器人', type: 'error', offset: 300 });
				}
			});
		},

		getFaDanTimingList(name='list') {
			var that = this;
			var loadStr = name == "list" ? "fadanLoad" : "asyncLoad";
			var data = name == "list" ? {
				type: that.jobSearch.type,
				order_type: that.jobSearch.order_type,
				order_val: that.jobSearch.order_val,
				fangan_id: that.jobSearch.fangan_id,
				ex_type: that.jobSearch.ex_type,
				ex_status: that.jobSearch.ex_status,
				kw: that.jobSearch.kw,
				bianhao:that.jobSearch.bianhao,
				page: that.table_data.currPage,
				size: that.table_data.size,
				sort: that.tableSort,
			}:that.asyncSearch;
			this[loadStr] = true;
			$.post('/wx/FaDanTiming/getFaDanTimingList', data, function(json) {
				that[loadStr] = false;
				if (json.code == 200) {
					if(name == "list"){
						that.table_data.total = json.data.total;
						that.table_data.totalPage = json.data.totalPage;
						that.table_data.currPage = json.data.currPage;
						that.table_data.list = json.data.list;
					}else{
						that.asyncList = json.data.list;
						that.asyncSearch.total = json.data.total;
					}
				} else {
					if(name == "list"){
						that.table_data = {list: [],total: 0,size: 20,totalPage: 0,currPage: 1,};
					}else{
						that.asyncList = [];
						that.asyncSearch.total = 0;
					}
					//that.$message({ message: json.msg, type: 'error', offset: 300 })
				}
				setTimeout(() => {
					that[loadStr] = false;
				}, 100);
			});
		},
		// 获取发单分组
		getFaDanGroup(){
			let that = this;
			$.post('/wx/FaDan/fangAnGroupList', {}, function(json) {
				if (json.code == 200) {
					json.data.push({
						id:'0',
						name:'未分组'
					})
					that.group_list = that.flattenData(json.data);
				} else {
					that.$message({ message: json.msg, type: 'error', offset: 120 });
				}
			}, "json");
		},
		// 处理下拉的分组
		flattenData(data, prefix = '') {
		    const result = [];
		    data.forEach(item => {
		        const flattenedItem = {
		            id: item.id,
		            name: `${prefix}|-- ${item.name}`,
		        };
		        result.push(flattenedItem);
		        if (Array.isArray(item.son) && item.son.length > 0) {
		            result.push(...this.flattenData(item.son, `${prefix}|-- `));
		        }
		    });
		    return result;
		},
		//获取发单方案
		getFanganList() {
			var that = this;
			$.post('/wx/FaDan/getFanganList', {}, function(json) {
				if (json.code == 200) {
					that.fangan_list = json.data;
					for (var i in json.data) {
						var id = json.data[i].id;
						that.fangan_list_id2index[id] = json.data[i];
					}

				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}

				// 获取定时任务列表
				that.getFaDanTimingList();
				that.fuGetRobotGrouplist();

			});
		},
		// 复制文字内容
		copy(content) {
			var that = this;
			this.$copyText(content).then(
				function(e) {
					console.log("copy arguments e:", e);
					that.$message({
						message: "复制成功",
						type: 'success',
						offset: 200,
						duration:1750,
					});

				},
				function(e) {
					console.log("copy arguments e:", e);
					that.$message({
						message: "复制失败",
						type: 'error',
						offset: 200,
						duration:1750,
					});
				}
			);
		},
		show_lm_rule_log(row) {
			// 获取绑定信息获取
			var id = row.id;
			this.show_rule_log = true;
			this.rule_log_params.fanganid = id
			this.get_lm_rule_list();
		},
		get_lm_rule_list() {
			var that = this;
			$.post('/wx/FaDanWithLm/get_lm_rule_list', that.rule_log_params, function(json) {
				if (json.code == 200) {
					that.rule_log_data = json.data;
				}
			}, "json");

		},
		pSizeChange(val) {
			this.rule_log_params.size = val
			this.get_lm_rule_list();
		},
		pCurrentChange(val) {
			this.rule_log_params.page = val
			this.get_lm_rule_list();
		},
		getlm_account(mm_id) {
			// 回去联盟对应的数据信息
			for (var i in this.taobaoAccountlist) {
				var get_mm_id = this.taobaoAccountlist[i].mm_pid;
				var taobao_user_nick = this.taobaoAccountlist[i].taobao_user_nick;
				if (mm_id == get_mm_id) {
					return mm_id + "(" + taobao_user_nick + ")";
				}
			}

			return mm_id + '(联盟不存在)';
		},
		get_taobaoAccount() {
			// /cms/TaobaoAccount/getAccountList
			var that = this;
			$.post('/cms/TaobaoAccount/getAccountList', {
				src: "yunzk_fadan2"
			}, function(json) {
				if (json.code == 200) {
					that.taobaoAccountlist = json.data.accountList;
					that.tb_auth_url = json.data.auth_url;
					console.log(that.taobaoAccountlist);
				}
			}, "json");
		},

		funCopyUrl(url) {
			var that = this;
			that.$copyText(url).then(function(e) {
				that.$message({
					message: '复制成功',
					type: 'success',
					offset: 200,
					duration:1750,
				})
			}, function(e) {
				that.$message({
					message: '复制失败',
					type: 'error',
					offset: 200,
					duration:1750,
				})
			});

		},
		delsetting(row) {
			var id = row.id;
			var name = row.title
			this.$confirm('确定将【' + name + '】 删除吗？ ', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				customClass: 'close-tips',
				type: 'warning'
			}).then(() => {
				// 执行删除请求
				var that = this;
				$.post('/wx/FaDanWithLm/delsetting', {
					id
				}, function(json) {
					if (json.code == 200) {
						that.$message({
							message: json.msg,
							type: 'success',
							offset: 200,
							duration:1750,
						})
						that.search();
					} else {
						that.$message({
							message: json.msg,
							type: 'error',
							offset: 200,
							duration:1750,
						})
					}
				}, "json");
			}).catch(() => {
				// 取消
			});;

		},
		getfangan(id) {
			var fangan_list = this.fangan_list;
			for (var i in fangan_list) {
				var newid = fangan_list[i].id;
				if (id == newid) {
					return fangan_list[i].name;
				}
			}
		},
		change_status(row, type) {
			// 执行状态修改
			var status = row.fadan_status;
			if (type == 'status') {
				status = row.status;
			}
			var id = row.id;
			var that = this;
			$.post('/wx/FaDanWithLm/savestatus', {
				id,
				status,
				type
			}, function(json) {
				if (json.code == 200) {
					that.$message({
						message: json.msg,
						type: 'success',
						offset: 200,
						duration:1750,
					})
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}

			});
		},
		do_edit_setting(row) {
			this.show_add_setting = true;
			this.setting_params = row;

		},
		clear_data() {
			var setting_params = {
				title: '',
				lm_id: "",
				config: {
					text_ys: 3,
					pic_ys: 3,
					video_ys: 3,
					gif_ys: 3,
				},
				fangan_sel: [],
				status: "Y",
				fadan_status: 'Y',
			};
			this.setting_params = setting_params;
		},
		//获取发单方案
		// getFanganList() {
		//      var that = this;
		//      $.post('/wx/FaDan/getFanganList', {}, function(json) {
		//        if (json.code == 200) {
		//          that.fangan_list = json.data;
		//        } else {
		//          that.$message({ message: json.msg, type: 'error', offset: 300 })
		//        }

		//      });
		// },

		create_setting() {
			// 添加方案
			console.log(this.setting_params);
			var that = this;
			$.post('/wx/FaDanWithLm/create_setting', that.setting_params, function(json) {
				if (json.code == 200) {
					that.show_add_setting = false;
					that.$message({
						message: json.msg,
						type: 'success',
						offset: 200,
						duration:1750,
					})
					that.getlist();
				} else {
					that.$message({
						message: json.msg,
						type: 'error',
						offset: 200,
						duration:1750,
					})
				}

			});
		},
		do_close_setting() {
			console.log('执行窗口关闭');
		},
		search() {
			this.loading = true;
			this.searchParams.page = 1;
			this.getlist();
		},
		getlist() {
			// 获取数据
			var that = this;
			$.post('/wx/FaDanWithLm/getlist', this.searchParams, function(json) {
				that.loading = false;
				if (json.code == 200) {
					that.tableData = json.data;
				}
			}, "json");
		},
		SizeChange(val) {
			this.searchParams.size = val
			this.getlist();
		},
		CurrentChange(val) {
			this.searchParams.page = val
			this.getlist();
		},
		// 修改全部折叠
		changeFold(e){
			this.fold = e;
			this.replyForm.msg.forEach((item,index)=>{
				item.showContent = !e;
			})
		},
		// 修改单个折叠
		changeZD(e,index){
			let line = this.replyForm.msg[index];
			line.showContent = !line.showContent;
		},
		// =============语音方法==============

		getFdRobotlist(){
			var that = this;
			if(that.replyForm.fangan_sel.length == 0){
				that.$message({message: '请选择发单方案',type: 'error',offset: 200,showClose: true})
				return
			}
			$.post('/wx/FaDan/getFdRobotlist', {
				fangan_ids:that.replyForm.fangan_sel
			}, function(json) {
				that.voiceDialog =  true;
				that.voiceRobotList = json.data;
				that.getVoiceList()
			})
		},
		getCollectionList(page){
			var that = this;
			if(page){
				that.collectionData.currPage = page;
			}else{
				that.collectionData.currPage = 1;
			}
			that.getVoiceList();
		},
		getVoiceList(page){
			var that = this;
			if(page){
				that.collectionData.currPage = page;
			}
			that.collectionData.loading = true;
			$.post('/common/common/getVoiceList',{
				robot_wxid:that.voiceRobotSelect,
				remark:that.collectionData.remark,
				page:that.collectionData.currPage,
				size:that.collectionData.size,
				type:3
			},(json) =>{
				that.collectionData.loading = false;
				if(json.code == 200){
                    if(json.data.length == 0) {
                        that.collectionData.list = [];
					}else{
                        that.collectionData.list = json.data.list.map(item => ({...item,new_remark:item.remark,edit_type:false,setTimeoutTimer:null,dVoiceLoading:false}));
					}
					that.collectionData.total = json.data.total;
				}else{
					that.$message.error(json.msg);
				}
			})
		},
		// 编辑备注
		eidtCollectionRemark(obj,type){
			var that = this;
			that.voiceSelet = obj;
			that.collectionData.list.forEach(item => {
				if(obj.id == item.id){
					if(that.collectionType == 'audio'){
						 item.edit_type = true;
					}else{
						if(type == 'title'){
							item.edit_title_type = true;
						}else{
							item.edit_type = true;
						}
					}
				}else{
					if(item.edit_title_type) {
						 item.edit_title_type = false;
					}
					item.edit_type = false;
				}
			})
			if(type == 'title'){
				this.$nextTick(() => {
					that.$refs['reftitle' + obj.id].focus();
				});
			}else{
				this.$nextTick(() => {
					that.$refs['ref' + obj.id].focus();
				});
			}
		},
		// 失去焦点 处理
		handleBlur(obj){
			var that = this;
			let index = that.collectionData.list.findIndex(item => item.id == obj.id);
			that.collectionData.list[index].edit_title_type = false;
			that.collectionData.list[index].edit_type = false;
		},
		editRemarek(row) {
			var that = this;
			that.saveVoice('edit',false,row)
		},
		saveVoice(type,sendType = false,row) {
			var that = this;
			let data = '';
			let index = 0;
			if(type == 'edit') {
				index = that.collectionData.list.findIndex(item => item.id == that.voiceSelet.id);
				data = {
					id:that.collectionData.list[index].id,
					remark:that.collectionData.list[index].new_remark,
					robot_wxid:row.robot_wxid,
					type:3,
					robot_type: row.robot_type.indexOf('qy') != -1 ? 'qy' : 'gr'
				}
			}else{
				if(that.newVoicerData == ''){
					that.$message({ message: '暂未采集到语音',  type:'success', showClose:true })
					return
				}
				data = {
					cdn_data:that.newVoicerData.voice,
					robot_wxid:that.voiceRobotSelect,
					remark:that.newVoiceremarks,
					type:3,
					robot_type: that.voiceRobotList.find(item => item.wxid == that.voiceRobotSelect).type.indexOf('qy') != -1 ? 'qy' : 'gr'
				}
			}
			$.post('/common/common/saveVoice', data, (json) =>{
				if(json.code == 200){
					if(type == 'edit'){
						this.collectionData.list[index].remark = that.collectionData.list[index].new_remark ;
						that.collectionData.list[index].edit_type = false;
						that.voiceSelet = '';
						that.$message({ message: '修改备注成功',  type:'success', showClose:true })
					}else{
						// 确认保存
						if(sendType) {
							that.newVoiceDialog = false;
							that.newVoicerData = '';
							this.getVoiceList()
						}else{
						// 保存并继续
							that.newVoicerData = '';
							that.getVoiceList();
							that.newVoice();
						}
					}
				}else{
					that.$message.error(json.msg);
				}
			})
		},
		 // tips:dVoice 音频已经上传，后台未来及时返回，可以掉dVoice接口手动返回
		dVoice(obj,size = 1){
			let that = this;
			let index = that.collectionData.list.findIndex(item => item.id == obj.id);
			$.post('/wx/Group_laqun/dVoice', {
				robot_wxid:obj.robot_wxid,
				aes_key:obj.aes_key,
				id:obj.id
			}, (json) =>{
				that.collectionData.list[index].dVoiceLoading = true;
				if(json.code == 200){
					that.collectionData.list[index].dVoiceLoading = false;
					that.collectionData.list[index].mp3_file = json.data;
					clearTimeout(that.collectionData.list[index].setTimeoutTimer);
					that.collectionData.list[index].setTimeoutTimer = null;
				}else if(json.code == 201  && size < 10 ) {
					that.collectionData.list[index].setTimeoutTimer = setTimeout(() => {
						that.dVoice(obj,size + 1)
					},1500)
				}else{
					that.$message({ message: json.msg,  type:'error', showClose:true, })
					that.collectionData.list[index].dVoiceLoading = false;
					clearTimeout(that.collectionData.list[index].setTimeoutTimer);
					that.collectionData.list[index].setTimeoutTimer = null;
				}
			})
		},
		// 选择
		selectcaijiVoice(row){
			var that = this;
			console.log(row);
			if(row.mp3_file == ''){
				that.$message({ message: '请先进行播放下载,确认采集语音是否正确',  type:'error', showClose:true, })
				return
			}
			// that.reply_msg.msg = row.cdn_data;
			let data = {
				mp3_file:row.mp3_file,
				remark:row.remar,
				voice_id:row.id,
			}
			that.reply_msg.msg = JSON.stringify(data);
			console.log(that.reply_msg.msg);
			if(row.robot_type == 'qy'){
				that.reply_msg.qy_cdn = row.cdn_data;
			}else{
				that.reply_msg.gr_cdn = row.cdn_data;
			}
			that.voiceDialog = false;
		},
		// 删除
		delVoice(item){
			var that = this;
			that.$confirm(`此操作将永久删除该语音, 是否继续?`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(async () => {
				$.post('/wx/Group_laqun/delVoice',{
					id:item.id
				},(json) =>{
					if(json.code == 200){
						that.$message({ message: '删除成功',  type:'success', showClose:true, })
						that.getVoiceList(that.collectionData.currPage)
					}else{
						that.$message.error(json.msg);
					}
				})
			}).catch(()=>{})
		},
		// 采集
		hadleCommand(){
			var that = this;
			this.newVoice()
		},
		// 清除上一次的采集
		newVoice(){
			var that = this;
			if(that.newVoiceLoading) {
				that.$message({message: '请等待上一次上传结束', type: 'error', showClose: true})
				return;
			}
			if(!that.voiceRobotSelect){
				that.$message({ message: '请选择上传机器人',  type:'error', showClose:true, })
				return
			}
			if(that.voiceRobotList.find(item => item.wxid == that.voiceRobotSelect).online == 'N'){
				that.$message({ message: '请选择在线机器人采集',  type:'error', showClose:true, })
				return
			}
			that.newVoiceDialog = true;
			that.newVoiceLoading = true;
			that.newVoicerData = '';
			that.newVoiceremarks = '';
			$.post('/wx/Group_laqun/clearChatVoice',{
				wxid:that.voiceRobotSelect
			},(json) =>{
				if(json.code == 200){
					that.getChatVoice()
				}else{
					that.$message.error(json.msg);
				}
			})
		},
		newVoiceDialogClose(){
			var that = this;
			that.newVoiceLoading = false;
			clearTimeout(that.newVoicerSetTimeOff);
			that.newVoicerSetTimeOff = null;
		},
		getChatVoice(){
			var that = this;
			$.post('/wx/Group_laqun/getChatVoice',{
				wxid:that.voiceRobotSelect
			},(json) =>{
				if(json.code == 200){
					that.newVoicerData = json.data;
					that.newVoiceLoading = false;
					clearTimeout(that.newVoicerSetTimeOff);
					that.newVoicerSetTimeOff = null;
				}else if(json.code == 500){
					that.newVoicerSetTimeOff = setTimeout(()=>{
                        that.getChatVoice()
                    },1500)
				}else{
					that.$message.error(res.msg);
				}
			})
		},
		// 保存
		preservation(type){
			var that = this;
			if(that.newVoiceLoading){
				that.$message({ message: '暂未采集到数据，无法保存',  type:'error', showClose:true })
				return;
			}
			that.saveVoice('save', type);
		},
	},
	mounted() {
		var that = this;
		if (location.hash != '') {
			that.activeName = location.hash.replace('#', '');
		}
		try{
			this.jobSearch.fangan_id = new URLSearchParams(window.location.search).get('fangan_id')
		}catch(e){
			this.jobSearch.fangan_id = ''
			console.log(e)
		}

		that.getFaDanGroup();
		// 获取方案的同时获取任务列表
		that.getFanganList();
		var send_time_zhuijia = localStorage.getItem('send_time_zhuijia_fadan');
		if (send_time_zhuijia != null) {
			that.send_time_zhuijia = send_time_zhuijia;
		}
		// this.getFanganList();
		this.get_taobaoAccount();
		this.getlist();
		//设置默认表情包数组
		that.gifList = that.gifList_keai;


		that.getTodayWeekday()
		// var id = GetQueryValue('id');
		// var wxid = GetQueryValue('wxid');
		// if (id && wxid) {
		//   this.params.id = id;
		//   this.params.wxid = wxid;
		// } else {
		//   // 如果没传入wxid则尝试在localStorage内检索
		//   var robot = localStorage.getItem('pl_haoyou_robot');
		//   if (robot) {
		//     var robotInfo = JSON.parse(robot);
		//     this.params.id = robotInfo.id;
		//     this.params.wxid = robotInfo.wxid;
		//   }

		// }



	}

});
function commandDel(){
	vm.command_del();
}
function copyErrorMessageData(robot_types){
	let	filename = `定时发单排单数据异常_${new Date().getTime()}.txt`;
	let saveData = {
		robot_types: robot_types,
		replyFormMsg: vm.replyForm.msg
	};
	if (typeof saveData === "object") {
		saveData = JSON.stringify(saveData, undefined, 4);
	}
	var blob = new Blob([saveData], { type: "text/json" }),
		e = document.createEvent("MouseEvents"),
		a = document.createElement("a");
	a.download = filename;
	a.href = window.URL.createObjectURL(blob);
	a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
	e.initMouseEvent( "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null );
	a.dispatchEvent(e);
}

// 回调
function clallbackwxid(id, wxid) {
	layer.closeAll();
	vm.okChange(id, wxid);
}

function timestampToTime(timestamp, type = 0, length) {
	var date = 0
	if (length == 13) {
		date = new Date(Number(timestamp)); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
	} else {
		date = new Date(Number(timestamp * 1000)); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
	}
	var Y = date.getFullYear() + '/';
	var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '/';
	var D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
	var h = (date.getHours() < 10 ? '0' + (date.getHours()) : date.getHours()) + ':';
	var m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':';
	var s = (date.getSeconds() < 10 ? '0' + (date.getSeconds()) : date.getSeconds());
	if (type == 1) {
		return Y + M + D;
	} else {
		return Y + M + D + h + m + s;
	}
}

function deepClone(data) {
	if (data == null || typeof(data) != 'object') {
		return data;
	}
	if (data instanceof Array) {
		var newArray = [];
		for (var i = 0; i < data.length; i++) {
			newArray[i] = deepClone(data[i]);
		}
		return newArray;
	} else if (data instanceof Object) {
		var newObject = {};
		for (var key in data) {
			newObject[key] = deepClone(data[key]);
		}
		return newObject;
	}
}


//#region 方案补发群相关逻辑为新加内容独立出去
function fanganMixin() {
	return {

		data() {
			return {
				needFadanRobotGroup: 0, // 是否需要补发
				groupSearchText: '', // 群搜索文本

				showGroupSelectDialog: false, // 补发群弹窗
				robotListData: [], // 机器人列表

				// 当前选择的机器人
				selectedRobotIndex: 0,
				robotSearchText: '', // 机器人搜索文本
				isEditMode: false, // 是否为编辑模式
				showAllPMode: false, // 是否显示全部群组
				backupSelectedGroups: [], // 备份已选择的群组

				// 映射表,用机器人的wxid做key,值为群聊对象
				pageRGMap: {},
				// 映射表,所有群聊的conversation_id数组
				allGroupIds: [],


				// ===============================================下方为旧代码补丁
				// 1. 点击预览区上下排序会导致数据丢失的,所以每次操作数据都对当前数据进行一次备份,没复现出来,暂时不启用
				prevBackData: {}
			}
		},
		methods: {
			fadanRobotGroupChange(val) {
				if (val == 0) {
					this.$nextTick(() => {
						this.$set(this.replyForm, 'fangan_sel', []);
						this.faDanSelClear()
						this.$forceUpdate()
					})
				} else this.$set(this.replyForm, 'fangan_sel', '')
			},
			faDanSelClear() {
				this.robotListData = [];
				// 清空映射表
				this.pageRGMap = {};
				// 清空已选择的群组ID列表
				this.allGroupIds = [];
				// 清空已选择的群组
				this.backupSelectedGroups = [];
				// 清空当前选择的机器人索引
				this.selectedRobotIndex = 0;
				// 清空搜索文本
				this.robotSearchText = '';
				// 清空表格的选中状态
				this.$refs.groupTable.clearSelection();
				// 清空搜索文本
				this.groupSearchText = '';
				// 清空是否显示全部群组的状态
				this.showAllPMode = false;
				// 清空是否为编辑模式的状态
				this.isEditMode = false;
			},
			searchGroups() {
				// 搜索群组
				const currentRobot = this.robotListData[this.selectedRobotIndex];
				// 重新获取当前机器人的所有群组
				this.getFanganRobotList(this.replyForm.fangan_sel);
			},


			//
			handleGroupSelectionChange(selection, row) {
				// 获取当前机器人的所有群组
				const currentRobot = this.robotListData[this.selectedRobotIndex];
				if (!currentRobot) return;

				const parentWxid = row.parent.wxid;

				// 在映射表中找到对应的群组,此逻辑改到返回群列表的时候处理
				if (this.pageRGMap[parentWxid]) {
					this.pageRGMap[parentWxid].forEach(group => {
						if (group.conversation_id === row.conversation_id) {
							// 根据是否在 selection 中来设置 selected 状态,由另一个状态进行接管
							if (!this.showAllPMode) group.selected = selection.some(item => item.conversation_id === row.conversation_id);
							group.nselected = selection.some(item => item.conversation_id === group.conversation_id);
						}
					});
				}

				// 更新所有已选群组的 ID 列表
				this.allGroupIds = [];
				for (const wxid in this.pageRGMap) {
					const groups = this.pageRGMap[wxid] || [];
					groups.forEach(group => {
						if (group.selected) {
							this.allGroupIds.push(group.conversation_id);
						}
					});
				}
			},
			handleGroupSelectionChangeAll(selection) {
				// 获取当前视图中实际显示的群组列表
				const displayedGroups = this.getCurrentRobotGroupList;
				if (!displayedGroups || displayedGroups.length === 0) return; // 如果当前视图没有群组，则不执行任何操作

				// 判断是全选还是全不选 (基于当前视图)
				// 注意：element-ui 的 select-all 事件参数 selection 可能是空的（全不选），也可能包含当前页所有可选行（全选）
				// 我们需要判断 selection 是否包含了 displayedGroups 中的所有项
				const isSelectAllAction = selection.length > 0 && selection.length >= displayedGroups.length;

				// 遍历当前视图中显示的群组
				displayedGroups.forEach(displayedGroup => {
					const parentWxid = displayedGroup.parent.wxid;
					const groupId = displayedGroup.conversation_id;

					// 在映射表中找到对应的群组
					if (this.pageRGMap[parentWxid]) {
						const targetGroup = this.pageRGMap[parentWxid].find(g => g.conversation_id === groupId);
						if (targetGroup) {
							// 根据是全选还是全不选来更新状态
							// 如果在显示所有已选模式下，更新 nselected；否则更新 selected
							const statusKey = this.showAllPMode ? 'nselected' : 'selected';
							this.$set(targetGroup, statusKey, isSelectAllAction); // 使用 $set 确保响应性
							// 如果不在显示所有已选模式下，也直接更新 selected，因为 handleGroupSelectionChange 也是这样做的
							if (!this.showAllPMode) {
								this.$set(targetGroup, 'selected', isSelectAllAction);
							}
						}
					}
				});

				// 操作完成后，重新计算全局的 allGroupIds 列表
				// 这一步很重要，因为它需要反映所有机器人下的选中状态总和
				const newAllGroupIds = [];
				for (const wxid in this.pageRGMap) {
					const groups = this.pageRGMap[wxid] || [];
					groups.forEach(group => {
						// 决定最终选中状态：如果在显示所有模式下操作过，以 nselected 为准，否则以 selected 为准
						let isSelected = group.selected;
						// 如果是在显示所有已选模式下，并且该群组有 nselected 属性，则以 nselected 的状态为准
						if (this.showAllPMode && group.hasOwnProperty('nselected')) {
							isSelected = group.nselected;
						}
						if (isSelected) {
							newAllGroupIds.push(group.conversation_id);
						}
					});
				}
				this.allGroupIds = newAllGroupIds;

				// 如果是在显示所有已选模式下取消了所有当前视图的勾选，可能需要强制更新视图
				// 测试后发现暂时不需要这个逻辑，因为在全选和全不选时，element-ui 会自动处理选中状态
				// if (this.showAllPMode && !isSelectAllAction) {
				// 	// 确保视图在取消勾选后能正确反映 getCurrentRobotGroupList 的变化
				// 	this.$nextTick(() => {
				// 		if (this.$refs.groupTable) {
				// 			this.$refs.groupTable.doLayout(); // 重新计算布局可能有助于更新
				// 		}
				// 	});
				// }
			},
			// 确认选择群
			confirmSelectGroups() {
				// 无论当前是否处于展示所有已选群组的模式，都需要同步选中状态
				for (const wxid in this.pageRGMap) {
					const groups = this.pageRGMap[wxid] || [];
					groups.forEach(group => {
						// 如果有nselected状态，则优先使用nselected更新selected
						if (group.hasOwnProperty('nselected')) {
							group.selected = group.nselected;
						}
					});
				}

				// 重新计算所有已选群组的ID列表
				this.allGroupIds = [];
				for (const wxid in this.pageRGMap) {
					const groups = this.pageRGMap[wxid] || [];
					groups.forEach(group => {
						if (group.selected) {
							this.allGroupIds.push(group.conversation_id);
						}
					});
				}

				// 关闭弹窗
				this.showGroupSelectDialog = false
				this.showAllPMode = false // 关闭显示所有已选群组的模式
			},
			/**
			 * 点击选择补发群组按钮
			 * @param {*} e
			 * @returns
			 */
			async selectFadanRobotGroup(e) {
				try {
					if (!e) return
					// 如果没有选择方案，则不执行操作,并提示用户
					if (!this.replyForm.fangan_sel || this.replyForm.fangan_sel.length <= 0) {
						this.$message.error('请选择方案');
						return
					}
					if (this.replyForm && this.replyForm.fangan_sel && this.replyForm.fangan_sel.length > 0) {
						this.showGroupSelectDialog = true
						await this.getFanganRobotList(this.replyForm.fangan_sel);
						// 重置获取第一个有选中群组的机器人下标，如果没有则默认为0
						let selectedRobotIndex = 0;
						for (let i = 0; i < this.robotListData.length; i++) {
							const robot = this.robotListData[i];
							if (robot.group && robot.group.some(group => this.allGroupIds.includes(group.conversation_id))) {
								selectedRobotIndex = i;
								break;
							}
						}
						this.setCurrentGroupList(this.robotListData[selectedRobotIndex], selectedRobotIndex);


					}
				} catch (error) {
					console.error('获取方案机器人列表失败:', error);
				}
			},
			// 获取机器人列表
			async getFanganRobotList(fanganIds, backdata) {
				try {
					const response = await ajaxRequest('/wx/FaDan/getFdRobotlist_keyong', {
						fangan_ids: fanganIds
					});
					if (response.code === 200) {
						this.robotListData = response.data.map(item => {
							return {
								...item,
								group: item.group.map(group => {
									return {
										...group,
										selected: this.allGroupIds.includes(group.conversation_id), // 判断是否已选中
										parent: {
											wxid: item.wxid,
											nickname: item.nickname
										}
									}
								})
							}
						})
						this.setCurrentGroupList(this.robotListData[0], 0)
						// 创建映射表,key为机器人的wxid,值为群聊对象集合
						this.pageRGMap = this.robotListData.reduce((acc, robot) => {
							const groups = robot.group || [];
							groups.forEach(group => {
								if (!acc[robot.wxid]) {
									acc[robot.wxid] = [];
								}
								const groupWithSelected = {
									...group,
									selected: this.allGroupIds.includes(group.conversation_id), // 判断是否已选中
									parent: {
										wxid: robot.wxid,
										nickname: robot.nickname
									}
								};
								acc[robot.wxid].push(groupWithSelected);
							});

							return acc;
						}, {});
						// 在表格加载完成后，根据allGroupIds设置选中状态
						this.$nextTick(() => {
							if (this.$refs.groupTable) {
								// 获取当前表格数据
								const tableData = this.getCurrentRobotGroupList;
								// 遍历当前表格数据，检查每一行是否在allGroupIds中
								tableData.forEach(row => {
									if (this.allGroupIds.includes(row.conversation_id)) {
										// 如果在allGroupIds中，则设置为选中状态
										this.$refs.groupTable.toggleRowSelection([{row, selected: true}], true);
									}
								});
							}
						});

					}
				} catch (error) {
					console.error('获取方案机器人列表失败:', error);
				}
			},
			setCurrentGroupList(item, index) {
				this.selectedRobotIndex = index
				// 复选框选中状态
				this.$nextTick(() => {
					if (this.$refs.groupTable) {
						// 获取当前表格数据
						const tableData = this.getCurrentRobotGroupList;
						// 遍历当前表格数据，检查每一行是否在allGroupIds中
						tableData.forEach(row => {
							if (this.allGroupIds.includes(row.conversation_id)) {
								// 如果在allGroupIds中，则设置为选中状态
								this.$refs.groupTable.toggleRowSelection([{row, selected: true}], true);
							}
						});
					}
				});
			},
			// 展示全部已选的群组,从映射表中所有机器人已选的群组,并展示出来
			//
			showAllSelectedGroup(val) {
				// 记录原来的状态
				const prevMode = this.showAllPMode;
				// 切换显示模式
				this.showAllPMode = !val;

				// 处理返回群列表时的逻辑：更新映射表中群组的selected状态
				if (!this.showAllPMode && prevMode) {
					// 从"显示所有已选"切换到"显示当前机器人群组"
					// 将所有通过nselected标记的选中状态同步到selected
					for (const wxid in this.pageRGMap) {
						const groups = this.pageRGMap[wxid] || [];
						groups.forEach(group => {
							// 如果有nselected状态，则优先使用nselected更新selected
							if (group.hasOwnProperty('nselected')) {
								group.selected = group.nselected;
							}
						});
					}

					// 重新计算allGroupIds
					this.allGroupIds = [];
					for (const wxid in this.pageRGMap) {
						const groups = this.pageRGMap[wxid] || [];
						groups.forEach(group => {
							if (group.selected) {
								this.allGroupIds.push(group.conversation_id);
							}
						});
					}
				}

				// 当切换视图时，确保正确勾选表格中的行
				this.$nextTick(() => {
					if (this.$refs.groupTable) {
						const tableData = this.getCurrentRobotGroupList;

						// 遍历当前表格数据，检查每一行是否在allGroupIds中
						tableData.forEach(row => {
							if (this.allGroupIds.includes(row.conversation_id)) {
								// 如果在allGroupIds中，则设置为选中状态
								this.$refs.groupTable.toggleRowSelection([{row, selected: true}], true);
							}
						});
					}
				});
			},

			isEmptyObject(obj) {
				// 检查对象是否为空
				return Object.keys(obj).length === 0 && obj.constructor === Object;
			},
			rowBackDataGroup(groupData) {
				// 清空已有的选择
				this.allGroupIds = [];

				// 遍历groupData对象，key是机器人wxid，value是群组ID数组
				for (const robotWxid in groupData) {
					const groupIds = groupData[robotWxid] || [];

					// 将所有群组ID添加到已选择群组列表
					this.allGroupIds.push(...groupIds);

					// 更新pageRGMap中的选中状态
					if (this.pageRGMap[robotWxid]) {
						this.pageRGMap[robotWxid].forEach(group => {
							// 如果群组ID在传入的数据中，则设置为已选中
							group.selected = groupIds.includes(group.conversation_id);
						});
					}
				}

				// 标记为编辑模式
				this.isEditMode = true;
			},


			// 补丁方法=====================
			setPrevBackData(index) {
				// 设置当前操作的备份数据,用于排序时使用
				this.prevBackData = this.replyForm.msg[index]
			}
		},
		computed: {
			filteredFadanRobotList() {
				if (!this.robotSearchText) return this.robotListData;
				const searchText = this.robotSearchText.toLowerCase();
				return this.robotListData.filter(robot =>
					robot.nickname.toLowerCase().includes(searchText)
					|| robot.wxid.toLowerCase().includes(searchText)
				);
			},
			getCurrentRobotGroupList() {
				// 如果showAllPMode为true，展示所有机器人下已经选中的群组
				if (this.showAllPMode) {
					let selectedGroups = [];
					// 遍历所有机器人的群组，筛选出已选中的
					for (const wxid in this.pageRGMap) {
						const groups = this.pageRGMap[wxid] || [];
						const selected = groups.filter(group => group.selected);
						selectedGroups = [...selectedGroups, ...selected];
					}

					// 如果有搜索关键词，进行模糊匹配过滤
					if (this.groupSearchText) {
						const searchText = this.groupSearchText.toLowerCase();
						return selectedGroups.filter(group =>
							(group.nickname && group.nickname.toLowerCase().includes(searchText)) ||
							(group.conversation_id && group.conversation_id.toLowerCase().includes(searchText))
						);
					}
					return selectedGroups;
				}
				// 否则展示当前选择的机器人的群组
				else if (this.robotListData.length > 0) {
					const currentRobot = this.robotListData[this.selectedRobotIndex];
					// 从映射表中获取当前机器人的群组，这样可以保留选中状态
					const groups = this.pageRGMap[currentRobot.wxid] || [];

					// 如果有搜索关键词，进行模糊匹配过滤
					if (this.groupSearchText) {
						const searchText = this.groupSearchText.toLowerCase();
						return groups.filter(group =>
							(group.nickname && group.nickname.toLowerCase().includes(searchText)) ||
							(group.conversation_id && group.conversation_id.toLowerCase().includes(searchText))
						);
					}
					return groups;
				}
				return [];
			},
			// 获取全部已选的群组的个数,
			getAllSelectedGroupsTotal() {
				// let total = 0;
				// for (const wxid in this.pageRGMap) {
				// 	const groups = this.pageRGMap[wxid] || [];
				// 	total += groups.filter(group => group.selected).length;
				// }
				// return total;
				return this.allGroupIds.length;
			},
			// 从映射表里获取获取所有已选择的群组的数据, 机器人wxid做key,值为群聊conversation_id数组
			getSelectedGroups() {
				// 创建一个新对象存储结果
				const selectedGroups = {};

				// 遍历映射表中的所有机器人
				for (const wxid in this.pageRGMap) {
					// 获取当前机器人的所有群组
					const groups = this.pageRGMap[wxid] || [];

					// 过滤出已选择的群组
					const selectedGroupIds = groups
						.filter(group => group.selected)
						.map(group => group.conversation_id);

					// 如果有选中的群组，则添加到结果对象中
					if (selectedGroupIds.length > 0) {
						selectedGroups[wxid] = selectedGroupIds;
					}
				}

				return selectedGroups;
			},

		}
	}
}

//#endregion
