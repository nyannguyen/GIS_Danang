import { Card } from 'antd';
import { db } from 'auth/FirebaseAuth';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';

const Summary = () => {
    const params = useParams();
    const [plan, setPlan] = useState({});
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        if(params.planId){
            db.collection("plans").doc(params.planId).get().then(plan => {
                setPlan(plan.data());
                if(plan.data().locations && plan.data().locations.length){
                    plan.data().locations.map(locationId => {
                        db.collection("sos-requests").doc(locationId).get().then(location => {
                            setLocations(oldValues => ([...oldValues,{
                                id: location.id,
                                ...location.data()
                            }]))
                        })
                    })
                }
            })
        }
    },[params.planId])

    function formatNumber(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }
      
    console.log(plan,locations);

    const onPrintReport = () => {
        var divContents = document.getElementsByClassName("print-area")[0].innerHTML; 
        var a = window.open('', ''); 
        a.document.write('<html>'); 
        a.document.write('<head><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous"><style>.no-print, .ant-card-head-title{display:none;}</style></head>')
        a.document.write('<body >'); 
        a.document.write('<h1>Tổng kết kế hoạch '+plan.name+'</h1>'); 
        a.document.write(divContents); 
        a.document.write('</body></html>'); 
        a.document.close(); 
        a.print(); 
    }

	return (
		<>
            <Card
                className="print-area"
                title={plan.name?`Tổng kết kế hoạch ${plan.name}`:"Đang tải dữ liệu"}
                loading={!plan.name}
                extra={<a href="#" className="no-print" onClick={onPrintReport}>In</a>} 
            >
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Ngày giờ</th>
                            <th scope="col">Số tiền</th>
                            <th scope="col">Vật phẩm</th>
                        </tr>
                    </thead>                
                    <tbody>
                        {
                            locations.map(location => {
                                var sum = 0;
                                return(
                                <>
                                    <tr>
                                        <td colSpan={4} className="font-weight-bold">Người / Hộ gia đình: {location.username}</td>
                                    </tr>
                                    {(location.donations && location.donations.length)?
                                        location.donations.filter(donation => donation.createdByToken === plan.createdByToken).map((donation,index) => {
                                            sum+=parseInt(donation.money);
                                            return(
                                                <tr>
                                                    <td>{index+1}</td>
                                                    <td>{moment(donation.createdAt.toDate()).format("DD-MM-YYYY HH:mm")}</td>
                                                    <td>{formatNumber(donation.money)}</td>
                                                    <td>{donation.items}</td>
                                                </tr>
                                            )
                                        })    
                                    :null}
                                    {(location.donations && location.donations.length)?
                                        <>
                                            <tr>
                                                <td className="font-weight-bold text-right" colSpan={1}>Số người / hộ gia đình: </td>
                                                <td className="font-weight-bold" colSpan={3}>{location.donations.length}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-weight-bold text-right" colSpan={1}>Tổng số tiền: </td>
                                                <td className="font-weight-bold" colSpan={3}>{formatNumber(sum)}</td>
                                            </tr>
                                        </>
                                    :<tr>
                                        <td colSpan={4}>Không có dữ liệu</td>
                                    </tr>}
                                </>)
                            })
                        }
                    </tbody>
                </table>
            </Card>
		</>
	)
}

export default Summary;
