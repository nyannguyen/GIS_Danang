import React, { useEffect } from 'react';
import './home.css';

const Home = () => {
	useEffect(() => {
		const options = {
		  key: 'PsLAtXpsPTZexBwUkO7Mx5I', 
		  lat: 16.047079,
		  lon: 108.206230,
		  zoom: 5,
		};
	
		window.windyInit(options, windyAPI => {
	
		const { map } = windyAPI;
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
		  
	  });  
	
	},[])

	return (
		<div id="windy"/>
	)
}

export default Home
