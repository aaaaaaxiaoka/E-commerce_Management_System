export interface RegionOption {
  value: string;
  label: string;
  children?: RegionOption[];
}

/** 省市区数据（简化版，供 Cascader 使用） */
export const regionOptions: RegionOption[] = [
  {
    value: "110000", label: "北京市", children: [
      { value: "110100", label: "北京市", children: [
        { value: "110101", label: "东城区" }, { value: "110102", label: "西城区" },
        { value: "110105", label: "朝阳区" }, { value: "110106", label: "丰台区" },
        { value: "110107", label: "石景山区" }, { value: "110108", label: "海淀区" },
        { value: "110109", label: "门头沟区" }, { value: "110111", label: "房山区" },
        { value: "110112", label: "通州区" }, { value: "110113", label: "顺义区" },
        { value: "110114", label: "昌平区" }, { value: "110115", label: "大兴区" },
        { value: "110116", label: "怀柔区" }, { value: "110117", label: "平谷区" },
      ]},
    ],
  },
  {
    value: "310000", label: "上海市", children: [
      { value: "310100", label: "上海市", children: [
        { value: "310101", label: "黄浦区" }, { value: "310104", label: "徐汇区" },
        { value: "310105", label: "长宁区" }, { value: "310106", label: "静安区" },
        { value: "310107", label: "普陀区" }, { value: "310109", label: "虹口区" },
        { value: "310110", label: "杨浦区" }, { value: "310112", label: "闵行区" },
        { value: "310113", label: "宝山区" }, { value: "310114", label: "嘉定区" },
        { value: "310115", label: "浦东新区" }, { value: "310116", label: "金山区" },
        { value: "310117", label: "松江区" }, { value: "310118", label: "青浦区" },
      ]},
    ],
  },
  {
    value: "440000", label: "广东省", children: [
      {
        value: "440100", label: "广州市", children: [
          { value: "440103", label: "荔湾区" }, { value: "440104", label: "越秀区" },
          { value: "440105", label: "海珠区" }, { value: "440106", label: "天河区" },
          { value: "440111", label: "白云区" }, { value: "440112", label: "黄埔区" },
          { value: "440113", label: "番禺区" }, { value: "440114", label: "花都区" },
        ],
      },
      {
        value: "440300", label: "深圳市", children: [
          { value: "440303", label: "罗湖区" }, { value: "440304", label: "福田区" },
          { value: "440305", label: "南山区" }, { value: "440306", label: "宝安区" },
          { value: "440307", label: "龙岗区" }, { value: "440308", label: "盐田区" },
          { value: "440309", label: "龙华区" }, { value: "440310", label: "坪山区" },
        ],
      },
      {
        value: "440600", label: "佛山市", children: [
          { value: "440604", label: "禅城区" }, { value: "440605", label: "南海区" },
          { value: "440606", label: "顺德区" }, { value: "440607", label: "三水区" },
          { value: "440608", label: "高明区" },
        ],
      },
      {
        value: "441900", label: "东莞市", children: [
          { value: "441901", label: "莞城区" }, { value: "441902", label: "南城区" },
          { value: "441903", label: "东城区" }, { value: "441904", label: "万江区" },
        ],
      },
    ],
  },
  {
    value: "330000", label: "浙江省", children: [
      {
        value: "330100", label: "杭州市", children: [
          { value: "330102", label: "上城区" }, { value: "330103", label: "下城区" },
          { value: "330104", label: "江干区" }, { value: "330105", label: "拱墅区" },
          { value: "330106", label: "西湖区" }, { value: "330108", label: "滨江区" },
          { value: "330109", label: "萧山区" }, { value: "330110", label: "余杭区" },
        ],
      },
      {
        value: "330200", label: "宁波市", children: [
          { value: "330203", label: "海曙区" }, { value: "330205", label: "江北区" },
          { value: "330206", label: "北仑区" }, { value: "330211", label: "镇海区" },
          { value: "330212", label: "鄞州区" },
        ],
      },
    ],
  },
  {
    value: "320000", label: "江苏省", children: [
      {
        value: "320100", label: "南京市", children: [
          { value: "320102", label: "玄武区" }, { value: "320104", label: "秦淮区" },
          { value: "320105", label: "建邺区" }, { value: "320106", label: "鼓楼区" },
          { value: "320111", label: "浦口区" }, { value: "320113", label: "栖霞区" },
          { value: "320114", label: "雨花台区" }, { value: "320115", label: "江宁区" },
        ],
      },
      {
        value: "320500", label: "苏州市", children: [
          { value: "320505", label: "虎丘区" }, { value: "320506", label: "吴中区" },
          { value: "320507", label: "相城区" }, { value: "320508", label: "姑苏区" },
          { value: "320509", label: "吴江区" },
        ],
      },
    ],
  },
  {
    value: "510000", label: "四川省", children: [
      {
        value: "510100", label: "成都市", children: [
          { value: "510104", label: "锦江区" }, { value: "510105", label: "青羊区" },
          { value: "510106", label: "金牛区" }, { value: "510107", label: "武侯区" },
          { value: "510108", label: "成华区" }, { value: "510112", label: "龙泉驿区" },
          { value: "510114", label: "新都区" }, { value: "510115", label: "双流区" },
        ],
      },
    ],
  },
  {
    value: "420000", label: "湖北省", children: [
      {
        value: "420100", label: "武汉市", children: [
          { value: "420102", label: "江岸区" }, { value: "420103", label: "江汉区" },
          { value: "420104", label: "硚口区" }, { value: "420105", label: "汉阳区" },
          { value: "420106", label: "武昌区" }, { value: "420107", label: "青山区" },
          { value: "420111", label: "洪山区" },
        ],
      },
    ],
  },
];
