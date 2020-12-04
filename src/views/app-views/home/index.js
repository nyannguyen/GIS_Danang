import { Button, Card, Col, Collapse, Image, Input, message, Pagination, Row, Skeleton, Table, Tree, Upload } from 'antd';
import {Form} from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { db,storage } from 'auth/FirebaseAuth';
import React, { useEffect, useState } from 'react';
import './home.css';
import moment from 'moment';
import { useSelector } from 'react-redux';
import firebase from 'firebase/app';
import { CheckOutlined, AimOutlined,InboxOutlined,EyeOutlined,SendOutlined } from '@ant-design/icons';
import { geolocated } from "react-geolocated"; //thư viện react-geolocated : cho phép lấy vị trí hiện tại của người dùng
import typhoons from "./typhoon-data-test";
import { useHistory } from 'react-router-dom';

const Home = (props) => {
	const [markerGroup,setMarkerGroup] = useState();
	const [viewList,setViewList] = useState([]);
	const [weatherData, setWeatherData] = useState({});
	const [initMap,setInitMap] = useState(false);
	const [showMarkerModal, setShowMarkerModal] = useState(false);
	const [showNewMarkerModal, setShowNewMarkerModal] = useState(false);

	const [currentMarkerLocation, setCurrentMarkerLocation] = useState({});
	const [currentMarkerData, setCurrentMarkerData] = useState({});

	const [user] = useState(useSelector(state=>state.auth));
	const [requestListImage,setRequestImageList] = useState([]);
	const history = useHistory();

	//xử lý khi người dùng nhấn vào sos marker
	function handleMarkerShowInfo(data) {
		var imgUrl = [];
		
		//kiểm tra có hình ảnh hay không
		if(data.images.length){
			Promise.all(data.images.map(async(imageName) => {
				//lấy địa chỉ của ảnh: https://firebasestorage.googleapis.com/v0/b/git-danang.appspot.com/o/70290813_1245817982288270_6327554710496608256_o.jpg?alt=media&token=a7dcc8ab-01f4-48a3-a528-a16821552800
				await storage.ref().child(imageName).getDownloadURL().then(url => {
					imgUrl.push(url);
				});
			})).then(() => {
				setWeatherData({});
				setCurrentMarkerData({
					...data,
					imgUrl: imgUrl
				});
				//hiện bảng hiện thông tin yêu cầu
				setShowMarkerModal(true);
			}) 
		} else {
			setCurrentMarkerData({
				...data,
				imgUrl: [] 
			});
			setShowMarkerModal(true);
		}
	}

	function hanldeMarkerCancel() {
		setShowMarkerModal(false);
	}

	//Hiển thị bảng nhập thông tin yêu cầu
	//currenLatLng - chứa kinh độ và vĩ độ của điểm vừa nhấn
	function onNewMarkerHandle(currenLatLng) {
		setRequestImageList([]);
		setCurrentMarkerLocation(currenLatLng);
		setShowNewMarkerModal(true);
	}

	function handleNewMarkerCancel() {
		setCurrentMarkerLocation({});
		setShowNewMarkerModal(false);
	}

	//tạo yêu cầu
	const onCreateRequest= (values) => {
		db.collection("sos-requests").add({
			username: values.username,
			description: values.description,
			lat: currentMarkerLocation.lat,
			lng: currentMarkerLocation.lng,
			createdAt: new Date(),
			createdBy: user.token,
			status: "ACTIVE",
			images: requestListImage,
		}).then(()=> {
			//hiện bảng thêm mới một yêu cầu trợ giúp
			setShowNewMarkerModal(false);
		});
	}

	//xóa yêu cầu
	const deleteRequest = () => {
		if(currentMarkerData.createdBy === user.token) { //kiểm tra có đúng là người tạo không
			db.collection("sos-requests").doc(currentMarkerData.id).update({
				status: "DELETED" //từ ACTIVE => DELETED
			}).then(()=> {
				//tắt bảng thông tin
				setShowMarkerModal(false);
			})
		}
	}

	const [windyMap, setWindyMap] = useState();

	const confirmDonation = (value) => {
		db.collection("sos-requests").doc(currentMarkerData.id).update({
			donations: firebase.firestore.FieldValue.arrayRemove(value) 
		}).then(() => {
			db.collection("sos-requests").doc(currentMarkerData.id).update({
				donations: firebase.firestore.FieldValue.arrayUnion({
					...value,
					confirmation:true
				}) 
			}).then(()=> {
				setShowMarkerModal(false);
			})
		})
	}

	const columns = [
		{
			title: "Thời gian",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (value) => {
				return moment(value?.toDate()).format("DD-MM-YYYY HH:mm")
			}
		},
		{
			title: "Người hỗ trợ",
			dataIndex: "createdBy",
			key: "username",
		},
		{
			title: "Nội dung hỗ trợ",
			key: "amount",
			render: (value) => {
				return <>
				<p>
					Số tiền: {value.money}
				</p>
				<p>
					Hiện vật: {value.items}
				</p>
				</>
			}
		},
		{
			title: "Xác nhận",
			key: "confirmation",
			render: (value) => {
				if(value.confirmation) {
					return <CheckOutlined />
				} else {
					if(currentMarkerData.createdBy === user.token)
						return <Button onClick={() => confirmDonation(value)} type="primary">Xác nhận</Button>
				}
				return "";
			}
		},
	];
	
	const [showDonation,setShowDonation] = useState(false);
	const handleDonationCancel = () => { setShowDonation(false) }

	//Thêm mới hỗ trợ
	const onDonationSubmit = (values) => {
		db.collection("sos-requests").doc(currentMarkerData.id).update({
			donators: firebase.firestore.FieldValue.arrayUnion(user.token), //id của người hỗ trợ
			donations: firebase.firestore.FieldValue.arrayUnion({
				createdAt: new Date(), //ngày tháng hỗ trợ
				money: values.money?values.money:0, //số tiền
				items: values.items?values.items:"", //hiện vật
				confirmation: false, //xác nhận
				createdByToken: user.token, //id của người hỗ trợ
				createdBy: firebase.auth().currentUser.displayName, //tên của người hỗ trợ
			})
		}).then(() => {
			db.collection("notifications").add({
				createdAt: new Date(),
				createdByToken: user.token, //id của người hỗ trợ
				message: "Bạn nhận được hỗ trợ mới từ "+firebase.auth().currentUser.displayName,
				requestId: currentMarkerData.id,
				requestOwnerId: currentMarkerData.createdBy
			})
			setShowDonation(false);
			setShowMarkerModal(false);
			message.success("Hỗ trợ thành công! Cảm ơn bạn!");
		})
	}

	//lấy tất cả các request đang có trong cơ sở dữ liệu và hiển thị lên màn hình
	const getAllRequest = () => {
		if(windyMap && markerGroup){
			//Tạo icon SOS
			var CustomSOSIcon = window.L.Icon.extend({options:{
				iconSize:[30, 50],
			}});
			var sosIcon = new CustomSOSIcon({iconUrl: '/img/SOS.png'});		
			//Tạo icon SOS

			//Lấy dữ liệu từ CSDL
			//onSnapshot - Cung cấp bởi Google Firestore -> Khi có sự thay đổi trong dữ liệu, hàm này được gọi lại
			//hàm onSnapshot trả về danh sách các documents (dữ liệu) -> thông tin về các request
			db.collection("sos-requests").where('status','==','ACTIVE').onSnapshot((querySnapshot)=> {
				//Tạo group markers cho các requests
				markerGroup.clearLayers();

				querySnapshot.forEach((doc) => {
					if((!viewList.length)||(viewList.length && viewList.indexOf(doc.id)!==-1)) {
						var marker = window.L.marker({
							lat: doc.data().lat, 
							lng: doc.data().lng
						},{icon: sosIcon}).addTo(markerGroup);

						//khi mà người dùng nhấn vào marker -> gọi tới hàm handleMarkerShowInfo
						marker.on('click',(e) => {
							handleMarkerShowInfo({
								id:doc.id, //id của request
								...doc.data() //dữ liệu của request
							});
						});
					}

					// marker.bindPopup("<p>Người/Hộ gia đình: "+doc.data().username+"<br>Tình trạng hiện tại: "+doc.data().description+"</p>");
				})
			})
		}
	}

	//lấy vị trí hiện tại của người dùng
	const getCurrentLocation = () => {
		//tạo group marker
		var currentPositionGroup = window.L.layerGroup().addTo(windyMap);

		//tạo icon
		var CustomIcon = window.L.Icon.extend({options:{
			iconSize:[20, 20],
		}});
		var locationIcon = new CustomIcon({iconUrl: '/img/location.png'});

		window.L.marker([props.coords.latitude, props.coords.longitude],{icon: locationIcon}).addTo(currentPositionGroup);

		//di chuyển map đến vị trí người dùng
		windyMap.setView([props.coords.latitude, props.coords.longitude],15);
	}

	const uploadProps = {
		name: 'file',
		listType:"picture",
		multiple: true,
		customRequest({ onError, onSuccess, file }) {
			const storageRef = storage.ref();
			const imgFile = storageRef.child(`${file.name}`);
			const metadata = {
			}		
			try {
			  const image = imgFile.put(file, metadata);
			  onSuccess(null, image);
			} catch(e) {
			  onError(e);
			}		
		},
		onChange(info) {
		  if (info.file.status !== 'uploading') {
			// console.log(info.file, info.fileList);
		  }
		  if (info.file.status === 'done') {
			// console.log(info.file, info.fileList);
			setRequestImageList(oldValues => [...oldValues,info.file.name]);
			message.success(`${info.file.name} tải lên thành công.`);
		  } else if (info.file.status === 'error') {
			// console.log(`${info.file.name} file upload failed.`);
		  }
		},
		showUploadList: false,
	};

	//báo cáo giả mạo
	const reportRequest = (request) => {
		db.collection("reports").doc(request.id).set({
			reportBy: firebase.firestore.FieldValue.arrayUnion({
				createdAt: new Date(), //thời điểm hiện tại
				createdByToken: user.token, //báo cáo này được gửi bởi người dùng nào?
				createdBy: firebase.auth().currentUser.displayName, //tên của người gửi báo cáo
			}),
			status: "PENDING" //đang chờ duyệt
		},{ merge: true }).then(() => {
			setShowMarkerModal(false);
			//hiện thông báo
			message.warning("Cảm ơn đã báo cáo! Chúng tôi sẽ xem xét sớm!");
		})
	}

	//xử lý khi người dùng thay đổi các tabs trong modal thông tin chi tiết
	const onTabsChange = (key) => {
		if(key.includes("3")) { //nếu người dùng nhấn vào tab thứ 3 - tab Thời tiết
			if(!weatherData.ts){
				fetch("https://api.windy.com/api/point-forecast/v2",{ //gọi tới api của Windy
					method: "POST",
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						"lat": currentMarkerData.lat, //vị trí của điểm muốn xem thời tiết
						"lon": currentMarkerData.lng, //vị trí của điểm muốn xem thời tiết
						"model": "gfs", //model gfs : lấy dữ liệu từ bản đồ toàn cầu - Windy yêu cầu
						"parameters" : ["temp", "precip", "wind", "windGust","waves"], //thông tin thời tiết muốn lấy về
						"levels": ["surface"],
						"key": "kiJj3naYA6S2OEc8BALEc7qJDYS9J5HU" //khóa Point Forecast api			
					})					
				}).then((response) => {
					response.json().then(data => {
						setWeatherData(data);
					});
				})
				.catch((err) => {
					console.log(err);
				})
			}
		}
	}

	const [currentWeatherPage,setCurrentWeatherPage] = useState(1);


	const [planModal, showPlanModal] = useState(false);
	const [planList, setPlanList] = useState([]);
	const [planData, setPlanData] = useState([]);
	const [selectedPlan, setSelectedPlan] = useState({});
	const [showAddPlan, setShowAddPlan] = useState(false);

	const onPlanSelect = (selectedKey,info) => {
		setSelectedPlan(info.node); //lưu lại thư mục đang chọn
	}

	const onAddToPlan = () => {
		if(!selectedPlan.isLeaf){
			db.collection("plans").doc(selectedPlan.key).update({
				locations: firebase.firestore.FieldValue.arrayUnion(currentMarkerData.id)
			}).then(() => {
				onShowPlanModal()
				message.success("Đã thêm!")
			});
		} else {
			message.error("Vui lòng chọn tên kế hoạch!")
		}
	}

	const getPlanList = () => {
		let list = [];

		return db.collection("plans").where('createdByToken','==',user.token).get().then((querySnapshot) => {
			if(querySnapshot.size){
				setPlanData(querySnapshot.docs.map(plan => {
					return({
						...plan.data(),
						id: plan.id
					})
				}))
				list = querySnapshot.docs.map(plan => {
					return ({
						isLeaf: false,
						title: plan.data().name,
						key: plan.id,
						children: []
					})
				});
			}
			return querySnapshot.docs;
		}).then(parent => {
			parent.map(plan => {
				if("locations" in plan.data() && plan.data().locations.length){
					plan.data().locations.map(locationToken => {
						db.collection("sos-requests").doc(locationToken).get().then(locationData => {
							if(locationData.exists) {
								list.filter(x => x.key === plan.id)[0].children.push({
									title: locationData.data().username,
									key: plan.id+"@"+locationData.id,
									isLeaf: true,
									checkable: false,
								})
							}
						})
					})	
				}
			})
		}).then(() => {
			setPlanList(list)
		})
	}

	const onShowPlanModal = () => {
		getPlanList().then(() => {
			showPlanModal(true);
		});
	}

	const removeRequestFromPlan = () => {
		if(selectedPlan.isLeaf){
			var parentKey = selectedPlan.key.split("@")[0];
			var childKey = selectedPlan.key.split("@")[1];
			db.collection("plans").doc(parentKey).update({
				locations: firebase.firestore.FieldValue.arrayRemove(childKey)
			}).then(() => {
				onShowPlanModal()
				message.success("Đã cập nhật!")
			});
		} else {
			message.error("Vui lòng chọn điểm đến cần xóa!");
		}
	}

	const removePlan = () => {
		//selectedPlan - kế hoạch đang được chọn
		if(!selectedPlan.isLeaf){ //kiểm tra xem đang chọn kế hoạch hay điểm đến
			db.collection("plans").doc(selectedPlan.key).delete().then(() => {
				getPlanList()
				message.success("Đã xóa kế hoạch!")
			});
		} else {
			message.error("Vui lòng chọn tên kế hoạch!");
		}
	}

	//thêm kế hoạch
	const onCreatePlan= (values, type=0) => {
		db.collection("plans").add({
			createdAt: new Date(), //ngày giờ tạo 
			name: values.name, //tên kế hoạch
			createdByToken: user.token, //id người tạo
		}).then(()=> {
			setShowAddPlan(false);
			getPlanList();
		});
	}

	const [planViewModal, showPlanViewModal] = useState(false);

	const onShowPlanViewModal = () => {
		if(!planList.length){
			getPlanList().then(() => {
				showPlanViewModal(true);
			});
		} else {
			showPlanViewModal(true);
		}
	}

	const onCheckPlan = (checkedKeys, info) => {
		var requestList = [];
		checkedKeys.forEach(plan => {
			var plan = planData.filter(x => x.id===plan)[0];
			if(plan.locations?.length){
				plan.locations.forEach(location => {
					if(requestList.indexOf(location)===-1) requestList.push(location);
				})
			}
		})
		setViewList(requestList);
	};

	const onRouting = () => {
		if(props.coords){
			var pointList = Object.keys(markerGroup._layers).map(pointId => +markerGroup._layers[pointId]._latlng.lat+","+markerGroup._layers[pointId]._latlng.lng).join("%7C");
			window.open("https://www.google.com/maps/dir/?api=1&origin="+props.coords.latitude+","+props.coords.longitude+"&destination="+props.coords.latitude+","+props.coords.longitude+"&travelmode=driving&waypoints="+pointList)
		} else {
			message.error("Không thể xác định vị trí của bạn");
		}
 	}

	//useEffect sẽ được chạy mỗi lần trang được load
	useEffect(() => {
		//khởi tạo bản đồ Windy
		if(!initMap) {
			const options = {
			key: '468H4rgpZYfhh4gVJ0hiPRuEw8frlfZj', //khóa bản quyền - Map Forecast API
			lat: 16.047079,
			lon: 108.206230,
			zoom: 5,
			};
		
			//Khởi tạo bản đồ Windy
			window.windyInit(options, windyAPI => {
				const { map } = windyAPI;

				setWindyMap(map);

				map.options.maxZoom = 18; //cài đặt zoom tối đa

				var topLayer = window.L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
			
				topLayer.setOpacity('0');       
			
				map.on('zoomend', function() {
					if (map.getZoom() >= 12) {
						topLayer.setOpacity('0.5');
					} else {
						topLayer.setOpacity('0');   
					}
				});

				var typhoonGroup = window.L.layerGroup().addTo(map); //Tạo nhóm marker bão

				//Tạo icon hình con mắt
				var CustomIcon = window.L.Icon.extend({options:{
					iconSize:[20, 20],
				}});
				var eyeIcon = new CustomIcon({iconUrl: '/img/eyestorm.png'});

				if(typhoons.length) {
					typhoons.forEach(typhoon => {
						typhoon.predict.forEach(dateData => {
							var eyeStorm = window.L.marker([dateData.position.lat,dateData.position.lon],{icon: eyeIcon}).addTo(typhoonGroup); //tạo mắt bão

							eyeStorm.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>"); //tạo thông tin khi nhấn vào mắt bão

							var circle15 = window.L.circle([dateData.position.lat,dateData.position.lon],{
								color: 'blue',
								weigth: '1',
								radius: dateData.radius15 * 1000
							}).addTo(typhoonGroup); //tạo vòng tròn màu xanh hiện vùng tâm bão có sức gió lên đến 15m/s

							circle15.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>");

							if(dateData.radius25) {
								var circle25 = window.L.circle([dateData.position.lat,dateData.position.lon],{
									color: 'red',
									weigth: '1',
									radius: dateData.radius25 * 1000
								}).addTo(typhoonGroup);//tạo vòng tròn màu đỏ hiện vùng tâm bão có sức gió lên đến 25m/s

								circle25.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>");
							}	
						})
					})
				}

				map.on('click', newRequest); //khi người dùng click vào bản đồ

				function newRequest(e) {
					//tham số e chứ lat, lng tại điểm click chuột
					console.log(e.latlng);
					onNewMarkerHandle(e.latlng);
				}

				var searchControl = window.L.esri.Geocoding.geosearch().addTo(map);

				var results = window.L.layerGroup().addTo(map);
			  
				searchControl.on('results', function (data) {
				  results.clearLayers();
				  for (var i = data.results.length - 1; i >= 0; i--) {
					results.addLayer(window.L.marker(data.results[i].latlng));
				  }
				});			  

				// var markerGroup = window.L.layerGroup().addTo(map);

				// var CustomSOSIcon = window.L.Icon.extend({options:{
				// 	iconSize:[30, 50],
				// }});
				// var sosIcon = new CustomSOSIcon({iconUrl: '/img/SOS.png'});		

				// db.collection("sos-requests").where('status','==','ACTIVE').onSnapshot((querySnapshot)=> {
				// 	markerGroup.clearLayers();
				// 	querySnapshot.forEach((doc) => {
				// 		if((!viewList.length)||(viewList.length && viewList.indexOf(doc.id)!==-1)) {
				// 			var marker = window.L.marker({lat: doc.data().lat, lng: doc.data().lng},{icon: sosIcon}).addTo(markerGroup);
				// 			marker.on('click',(e) => {
				// 				handleMarkerShowInfo({id:doc.id,...doc.data()});
				// 			});
				// 		}

				// 		// marker.bindPopup("<p>Người/Hộ gia đình: "+doc.data().username+"<br>Tình trạng hiện tại: "+doc.data().description+"</p>");
				// 	})
				// })
			});  
			setInitMap(true);
		}
		if(windyMap && !markerGroup) 				
			setMarkerGroup(window.L.layerGroup().addTo(windyMap));
		getAllRequest();
	},[props.coords,viewList,windyMap,markerGroup]);

	const showSummary = () => {
		if(!selectedPlan.isLeaf){
			history.push("/app/plan/"+selectedPlan.key);
		} else {
			message.error("Vui lòng chọn tên kế hoạch!")
		}
	}

	return (
		<>
		{/* Chứa bản đồ Windy */}
		<div id="windy"/>

		{/* Nút chỉ đường */}
		<Button 
			type="primary" 
			onClick={onRouting} 
			shape="circle" 
			icon={<SendOutlined />} 
			style={{ position: 'absolute', right: 20, bottom: 150 }}
		/>

		<Button 
			type="primary" 
			shape="circle" 
			onClick={onShowPlanViewModal}
			icon={<EyeOutlined />} 
			style={{ position: 'absolute', right: 20, bottom: 100 }}
		/>

		{/* Nút lấy vị trí hiện tại của người dùng */}
		<Button 
			type="primary" 
			onClick={getCurrentLocation} 
			shape="circle" 
			icon={<AimOutlined />} 
			style={{ position: 'absolute', right: 20, bottom: 50 }}
		/>

		{/* Modal thêm yêu cầu trợ giúp */}
		<Modal
			title="Thêm yêu cầu trợ giúp mới"
			visible={showNewMarkerModal}
			onCancel={handleNewMarkerCancel}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
		>
			<Form
				layout="vertical"
				initialValues={{username: "",description: ""}}
				onFinish={onCreateRequest}
			>
				<Form.Item
					label="Tên người / hộ gia đình cần giúp đỡ"
					name="username"
					rules={[{required: true, message: "Vui lòng cho biết tên người / hộ gia đình cần giúp đỡ!"}]}
				>
					<Input/>
				</Form.Item>
				<Form.Item
					label="Mô tả tình trạng hiện tại"
					name="description"
					rules={[{required: true, message: "Vui lòng cho biết tên người / hộ gia đình cần giúp đỡ!"}]}
				>
					<Input.TextArea rows={4}/>
				</Form.Item>
				<Upload {...uploadProps}>
					<Button icon={<InboxOutlined />}>Thêm ảnh để mô tả chi tiết</Button>
				</Upload>
				{requestListImage.length?
				requestListImage.map(image => {
					return(<p key={image}>{image}</p>)
				})
				:null}
				<Form.Item className="mt-3">
					<Button type="primary" htmlType="submit">
						Thêm mới
					</Button>
				</Form.Item>
			</Form>
		</Modal>
		{/* Modal thêm yêu cầu trợ giúp */}
		
		{/* Modal hiển thị thông tin chi tiết của yêu cầu */}
		<Modal
			title="Thông tin yêu cầu"
			onCancel={hanldeMarkerCancel}
			visible={showMarkerModal}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
			width={800}
		>
			{/* ml-{1-5}: margin left */}
			{/* mt-{1-5}: margin top */}
			{/* mb-3 : margin bottom  */}
			<Collapse className="mb-3" defaultActiveKey={[1]} onChange={onTabsChange}> 
				<Collapse.Panel header="Thông tin chung" key="1">
					<p>
						Ngày đăng tin: {moment(currentMarkerData.createdAt?.toDate()).format("DD-MM-YYYY HH:mm")}
					</p>
					<p>
						Người / Hộ gia đình cần giúp đỡ: {currentMarkerData.username}
					</p>
					<p>
						Tình trạng hiện tại: {currentMarkerData.description}
					</p>
				</Collapse.Panel>
				<Collapse.Panel header="Hình ảnh" key="2">
					<p className="mt-3 text-center">
						<b>HÌNH ẢNH</b>
					</p>
					{currentMarkerData.imgUrl?.length?
						currentMarkerData.imgUrl?.map((img,index) => {
							return <Image 
									width={200}
									height={200}
									key={index}
									src={img}
									fallback="data:image/png;base64,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"
								/>
						})
					:null}
				</Collapse.Panel>
				<Collapse.Panel header="Thời tiết" key="3">
						<Row className="mb-3">
							<Pagination className="m-auto" simple defaultCurrent={currentWeatherPage} total={200} onChange={(page) => setCurrentWeatherPage(page)} />
						</Row>
						<Row gutter={16}>
						{/* Hiển thị thời tiết  */}
						{weatherData.ts?.slice((currentWeatherPage-1)*4,(currentWeatherPage-1)*4+4).map((timestamp,index) => 
							<Col span={6}>
								<Card title={moment(new Date(timestamp)).format("DD-MM HH:mm")} key={timestamp}>
									<p>Nhiệt độ: {(weatherData["temp-surface"][(currentWeatherPage-1)*4+index] - 273.15).toFixed(2)} độ C</p>
									<p>Lượng mưa: {(weatherData["past3hprecip-surface"][(currentWeatherPage-1)*4+index]).toFixed(2)} {weatherData.units["past3hprecip-surface"]}</p>
									<p>Vận tốc gió (Tây - Đông): {(weatherData["wind_u-surface"][(currentWeatherPage-1)*4+index]).toFixed(2)} m/s</p>
									<p>Vận tốc gió (Nam - Bắc): {(weatherData["wind_v-surface"][(currentWeatherPage-1)*4+index]).toFixed(2)} m/s</p>
									<p>Vận tốc gió lúc giật: {(weatherData["gust-surface"][(currentWeatherPage-1)*4+index]).toFixed(2)} m/s</p>
								</Card>
							</Col>
						)}
						</Row>
				</Collapse.Panel>
				<Collapse.Panel header="Danh sách hỗ trợ" key="4">
					<Table className="mb-3" dataSource={currentMarkerData.donations} columns={columns} />
				</Collapse.Panel>
			</Collapse>
			{currentMarkerData.createdBy===user.token?
			<Button className="mr-3" danger onClick={deleteRequest}>Xóa yêu cầu</Button>
			:null}
			<Button className="mr-3" danger onClick={() => reportRequest(currentMarkerData)}>Báo cáo giả mạo</Button>
			<Button className="mr-3" type="primary" onClick={() => onShowPlanModal()}>Thêm vào kế hoạch</Button>
			<Button className="mr-3" type="primary" onClick={() => setShowDonation(true)}>Thêm hỗ trợ</Button>
			<Button className="mr-3" type="primary" onClick={() => window.open("https://www.google.com/maps/dir/?api=1&origin="+props.coords.latitude+","+props.coords.longitude+"&destination="+currentMarkerData.lat+","+currentMarkerData.lng+"&travelmode=driving")}>Chỉ đường</Button>
			{/* mr-3: margin right */}
		</Modal>
		{/* Modal hiển thị thông tin chi tiết của yêu cầu */}

		{/* Modal thêm hỗ trợ */}
		<Modal
			title="Nội dung hỗ trợ"
			visible={showDonation}
			onCancel={handleDonationCancel}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
		>
			<Form
				layout="vertical"
				onFinish={onDonationSubmit}
			>
				<Form.Item
					label="Hỗ trợ tiền:"
					name="money"
				>
					<Input/>
				</Form.Item>
				<Form.Item
					label="Hỗ trợ hiện vật"
					name="items"
				>
					<Input.TextArea rows={4}/>
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit">
						Thêm mới
					</Button>
				</Form.Item>
			</Form>
		</Modal>
		{/* Modal thêm hỗ trợ */}

		<Modal
			width={700}
			title="Chọn kế hoạch"
			visible={planModal}
			onCancel={()=> showPlanModal(false)}
			cancelButtonProps={{ style: { display: 'none' } }}
			footer={
				<>
				<Button onClick={removePlan} danger>Xóa kế hoạch</Button>
				<Button onClick={removeRequestFromPlan} danger>Xóa điểm đến</Button>
				<Button onClick={() => setShowAddPlan(true)} type="primary">Thêm kế hoạch</Button>
				<Button onClick={onAddToPlan} type="primary">Thêm điểm đến</Button>
				</>
			}
		>
			{planList.length?
			<Tree.DirectoryTree onSelect={onPlanSelect} treeData={planList}/>
			:<>Bạn chưa có kế hoạch nào, vui lòng tạo kế hoạch trước!</>}
		</Modal>
		
		<Modal
			width={700}
			title="Chọn kế hoạch/điểm đến cần hiển thị"
			visible={planViewModal}
			onCancel={()=> showPlanViewModal(false)}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
			footer={
				<>
				<Button onClick={removePlan} danger>Xóa kế hoạch</Button>
				<Button onClick={showSummary} type="primary">Xem tổng kết</Button>
				<Button onClick={() => setShowAddPlan(true)} type="primary">Thêm kế hoạch</Button>
				</>
			}
		>
			{planList.length?
			<Tree.DirectoryTree onCheck={onCheckPlan} onSelect={onPlanSelect} checkable treeData={planList}/>
			:<>Bạn chưa có kế hoạch nào, vui lòng tạo kế hoạch trước!</>}
		</Modal>
		
		<Modal
			title="Thêm kế hoạch mới"
			visible={showAddPlan}
			onCancel={()=>setShowAddPlan(false)}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
		>
			<Form
				layout="vertical"
				initialValues={{name: ""}}
				onFinish={onCreatePlan}
			>
				<Form.Item
					label="Tên kế hoạch"
					name="name"
					rules={[{required: true, message: "Vui lòng cho biết tên kế hoạch!"}]}
				>
					<Input/>
				</Form.Item>
				<Form.Item className="mt-3">
					<Button type="primary" htmlType="submit">
						Thêm mới
					</Button>
				</Form.Item>
			</Form>
		</Modal>
		
		
		</>
	)
}

export default geolocated({
	positionOptions: {
		enableHighAccuracy: true,
	},
	userDecisionTimeout: 5000
})(Home);
