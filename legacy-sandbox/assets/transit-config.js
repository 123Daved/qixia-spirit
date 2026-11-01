/* 观光车 · 出入口 · 停车场配置。
   站点位置依据《栖霞山导览图》上的「游览车停靠站」图标，配准到 OpenStreetMap 真实道路（偏差约 20–60 米）；
   线路走向由程序沿真实道路自动寻路。时刻、车辆、车位、客流参数为示意方案，非景区官方信息——
   拿到实地数据后直接改这里即可，页面无需改代码。坐标为 [纬度, 经度]（WGS84）。 */
window.QIXIA_TRANSIT={
 "hours":{"start":"07:30","end":"17:30"},
 "speedKmh":15,          // 山路观光车平均车速
 "dwellSec":40,          // 每站停靠时长
 "layoverMin":4,         // 终点站折返休息
 "stops":[
  {"id":"xm","name":"西门·游客中心","ll":[32.152958,118.94933],"near":["lake","stele"],"gate":"west"},
  {"id":"qf","name":"千佛岩站","ll":[32.154966,118.953075],"near":["cave","stele","palace"]},
  {"id":"yj","name":"幽居桥站","ll":[32.157545,118.958423],"near":["spring"]},
  {"id":"hy","name":"红叶谷站","ll":[32.159499,118.957256],"near":["maple"]},
  {"id":"sh","name":"始皇临江处站","ll":[32.161824,118.963102],"near":[]},
  {"id":"tj","name":"天街·凤翔峰站","ll":[32.160602,118.965702],"near":[]},
  {"id":"xy","name":"小营盘站","ll":[32.1554,118.960588],"near":["tea","stone","palace"]},
  {"id":"ym","name":"饮马池站","ll":[32.152822,118.960556],"near":["tea"]},
  {"id":"nm","name":"南门站","ll":[32.150343,118.962105],"near":[],"gate":"south"}
 ],
 // stops 按「上山」方向排列；下山即反向
 "lines":[
  {"id":"L1","name":"1号线","short":"西门线","color":"#b5452f","stops":["xm","qf","yj","hy","sh","tj"],"vehicles":["苏A·QX101","苏A·QX102","苏A·QX103"]},
  {"id":"L2","name":"2号线","short":"南门线","color":"#c8964a","stops":["nm","ym","xy","tj"],"vehicles":["苏A·QX201","苏A·QX202"]}
 ],
 "gates":[
  {"id":"west","name":"西门","ll":[32.152334,118.949202],"share":0.62,"taxi":"游客中心旁落客区","taxiPerHour":70},
  {"id":"south","name":"南门","ll":[32.14943,118.960938],"share":0.38,"taxi":"南门售票处外侧路边","taxiPerHour":35}
 ],
 // capacity 为空时按 OpenStreetMap 停车场面积估算（约 40 ㎡/车位，含通道）
 "parking":[
  {"id":"pw","name":"西门停车场","gate":"west","ll":[32.153492,118.945775],"capacity":null},
  {"id":"ps","name":"南门停车场","gate":"south","ll":[32.148534,118.958773],"capacity":null}
 ],
 // 客流参数（人/日）：平日基数 × 周末 × 红叶季 × 天气
 "visitors":{"weekday":6000,"weekend":1.9,"mapleSeason":2.3,"carShare":0.38,"perCar":2.6,"taxiShare":0.22},
 // 实时数据接口（留空则用估算/模拟）。fleet 由本地服务提供：司机端定位上报后实时可见
 "api":{"fleet":"api/fleet","gates":"","parking":""}
};
