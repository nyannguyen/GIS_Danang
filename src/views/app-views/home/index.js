import { Button, Card, Col, Collapse, Image, Input, message, Pagination, Row, Skeleton, Table, Tree, Upload } from 'antd';
import {Form} from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { db,storage } from 'auth/FirebaseAuth';
import React, { useEffect, useState } from 'react';
import './home.css';
import moment from 'moment';
import { useSelector } from 'react-redux';
import firebase from 'firebase/app';
import { CheckOutlined, AimOutlined,InboxOutlined,EyeOutlined } from '@ant-design/icons';
import { geolocated } from "react-geolocated";
import typhoons from "./typhoon-data-test";

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

	function handleMarkerShowInfo(data) {
		var imgUrl = [];
		
		if(data.images.length){
			Promise.all(data.images.map(async(imageName) => {
				await storage.ref().child(imageName).getDownloadURL().then(url => {
					imgUrl.push(url);
				});
			})).then(() => {
				setWeatherData({});
				setCurrentMarkerData({
					...data,
					imgUrl: imgUrl
				});
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

	function onNewMarkerHandle(currenLatLng) {
		setRequestImageList([]);
		setCurrentMarkerLocation(currenLatLng);
		setShowNewMarkerModal(true);
	}

	function handleNewMarkerCancel() {
		setCurrentMarkerLocation({});
		setShowNewMarkerModal(false);
	}

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
			setShowNewMarkerModal(false);
		});
	}

	const deleteRequest = () => {
		if(currentMarkerData.createdBy === user.token) {
			db.collection("sos-requests").doc(currentMarkerData.id).update({
				status: "DELETED"
			}).then(()=> {
				setShowMarkerModal(false);
			})
		}
	}

	const [windyMap, setWindyMap] = useState();

	useEffect(() => {
		if(!initMap) {
			const options = {
			key: 'PsLAtXpsPTZexBwUkO7Mx5I', 
			lat: 16.047079,
			lon: 108.206230,
			zoom: 5,
			};
		
			window.windyInit(options, windyAPI => {
				const { map } = windyAPI;

				setWindyMap(map);

				map.options.maxZoom = 18;

				var topLayer = window.L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
			
				topLayer.setOpacity('0');       
			
				map.on('zoomend', function() {
					if (map.getZoom() >= 12) {
						topLayer.setOpacity('0.5');
					} else {
						topLayer.setOpacity('0');   
					}
				});

				var typhoonGroup = window.L.layerGroup().addTo(map);
				var CustomIcon = window.L.Icon.extend({options:{
					iconSize:[20, 20],
				}});
				var eyeIcon = new CustomIcon({iconUrl: '/img/eyestorm.png'});
				if(typhoons.length) {
					typhoons.forEach(typhoon => {
						typhoon.predict.forEach(dateData => {
							var eyeStorm = window.L.marker([dateData.position.lat,dateData.position.lon],{icon: eyeIcon}).addTo(typhoonGroup);

							eyeStorm.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>");

							var circle15 = window.L.circle([dateData.position.lat,dateData.position.lon],{
								color: 'blue',
								weigth: '1',
								radius: dateData.radius15 * 1000
							}).addTo(typhoonGroup);

							circle15.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>");

							if(dateData.radius25) {
								var circle25 = window.L.circle([dateData.position.lat,dateData.position.lon],{
									color: 'red',
									weigth: '1',
									radius: dateData.radius25 * 1000
								}).addTo(typhoonGroup);

								circle25.bindPopup("<p><b>Tên bão: "+typhoon.name+"</b><br>Cập nhật gần nhất: "+moment(typhoon.lastUpdate).format("DD-MM-YYYY HH:mm")+"</p>"+"<br><b>Dự đoán cho ngày "+moment(dateData.timestamp).format("DD-MM-YYYY")+" </b></p>"+"<br>Áp suất không khí tại tâm bão: "+dateData.hPa+" hPa</p>"+"<br>Tốc độ gió tối đa: "+dateData.maxSusWind[0]+" m/s ~ "+ dateData.maxSusWind[1] +" km/s</p>"+"<br>Hướng di chuyển: "+dateData.movingDirection+"</p>"+"<br>Tốc độ di chuyển: "+dateData.movingSpeed+" km/h</p>"+"<br>Bán kín vùng có sức gió trên 15m/s: "+dateData.radius15+" km</p>"+"<br>Bán kính vùng có sức gió trên 25m/s: "+dateData.radius25+" km</p>");
							}	
						})
					})
				}

				map.on('click', newRequest);

				function newRequest(e) {
					onNewMarkerHandle(e.latlng);
				}

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
	const onDonationSubmit = (values) => {
		db.collection("sos-requests").doc(currentMarkerData.id).update({
			donators: firebase.firestore.FieldValue.arrayUnion(user.token),
			donations: firebase.firestore.FieldValue.arrayUnion({
				createdAt: new Date(),
				money: values.money?values.money:0,
				items: values.items?values.items:"",
				confirmation: false,
				createdByToken: user.token,
				createdBy: firebase.auth().currentUser.displayName,
			})
		}).then(() => {
			setShowDonation(false);
			setShowMarkerModal(false);
		})
	}

	const getAllRequest = () => {
		if(windyMap && markerGroup){
			var CustomSOSIcon = window.L.Icon.extend({options:{
				iconSize:[30, 50],
			}});
			var sosIcon = new CustomSOSIcon({iconUrl: '/img/SOS.png'});		

			db.collection("sos-requests").where('status','==','ACTIVE').onSnapshot((querySnapshot)=> {
				markerGroup.clearLayers();
				querySnapshot.forEach((doc) => {
					if((!viewList.length)||(viewList.length && viewList.indexOf(doc.id)!==-1)) {
						var marker = window.L.marker({lat: doc.data().lat, lng: doc.data().lng},{icon: sosIcon}).addTo(markerGroup);
						marker.on('click',(e) => {
							handleMarkerShowInfo({id:doc.id,...doc.data()});
						});
					}

					// marker.bindPopup("<p>Người/Hộ gia đình: "+doc.data().username+"<br>Tình trạng hiện tại: "+doc.data().description+"</p>");
				})
			})
		}
	}

	const getCurrentLocation = () => {
		var currentPositionGroup = window.L.layerGroup().addTo(windyMap);

		var CustomIcon = window.L.Icon.extend({options:{
			iconSize:[20, 20],
		}});
		var locationIcon = new CustomIcon({iconUrl: '/img/location.png'});

		window.L.marker([props.coords.latitude, props.coords.longitude],{icon: locationIcon}).addTo(currentPositionGroup);

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

	const reportRequest = (request) => {
		db.collection("reports").doc(request.id).set({
			reportBy: firebase.firestore.FieldValue.arrayUnion({
				createdAt: new Date(),
				createdByToken: user.token,
				createdBy: firebase.auth().currentUser.displayName,
			}),
			status: "PENDING"
		},{ merge: true }).then(() => {
			setShowMarkerModal(false);
			message.warning("Cảm ơn đã báo cáo! Chúng tôi sẽ xem xét sớm!");
		})
	}

	const onTabsChange = (key) => {
		if(key.includes("3")) {
			if(!weatherData.ts){
				fetch("https://api.windy.com/api/point-forecast/v2",{
					method: "POST",
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						"lat": currentMarkerData.lat,
						"lon": currentMarkerData.lng,
						"model": "gfs",
						"parameters" : ["temp", "precip", "wind", "windGust","waves"],
						"levels": ["surface"],
						"key": "kiJj3naYA6S2OEc8BALEc7qJDYS9J5HU"				
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
		setSelectedPlan(info.node);
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
		if(!selectedPlan.isLeaf){
			db.collection("plans").doc(selectedPlan.key).delete().then(() => {
				onShowPlanModal()
				message.success("Đã xóa kế hoạch!")
			});
		} else {
			message.error("Vui lòng chọn tên kế hoạch!");
		}
	}

	const onCreatePlan= (values) => {
		db.collection("plans").add({
			name: values.name,
			createdByToken: user.token,
		}).then(()=> {
			onShowPlanModal()
			setShowAddPlan(false);
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

	return (
		<>
		<div id="windy"/>
		<Button 
			type="primary" 
			shape="circle" 
			onClick={onShowPlanViewModal}
			icon={<EyeOutlined />} 
			style={{ position: 'absolute', right: 20, bottom: 100 }}
		/>
		<Button 
			type="primary" 
			onClick={getCurrentLocation} 
			shape="circle" 
			icon={<AimOutlined />} 
			style={{ position: 'absolute', right: 20, bottom: 50 }}
		/>
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
		<Modal
			title="Thông tin yêu cầu"
			onCancel={hanldeMarkerCancel}
			visible={showMarkerModal}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
			width={800}
		>
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
		</Modal>
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
			:<Skeleton active/>}
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
		
		<Modal
			width={700}
			title="Chọn kế hoạch/điểm đến cần hiển thị"
			visible={planViewModal}
			onCancel={()=> showPlanViewModal(false)}
			cancelButtonProps={{ style: { display: 'none' } }}
			okButtonProps={{ style: { display: 'none' } }}
		>
			{planList.length?
			<Tree.DirectoryTree onCheck={onCheckPlan} checkable treeData={planList}/>
			:<Skeleton active/>}
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
