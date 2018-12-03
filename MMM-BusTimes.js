Module.register("MMM-BusTimes",{
	defaults: {
		text: "Getting bus times!"
	},
	
	getStyles: function() {
		return ["bus-times.css", "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"];
	},

    start: function () {
		Log.error('Starting '+ self.name);
        this.getBusTimes();
	},
	
	getDom: function() {
		var div = document.createElement("div");
		div.className = 'mmm-uk-bus-times';
		var header = document.createElement("header");
		header.innerText = this.header;
		var table = document.createElement("table");
		if(!this.busTimes){
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			tr.appendChild(td);
			table.appendChild(tr);
			td.innerHTML = "Waiting for bus times!";
			div.appendChild(table);
			return div;
		}
		
		table.appendChild(this.createTableHeader());
		for(let i = 0; i<this.busTimes.length; i++){
			let tr = document.createElement("tr");
			let col1 = document.createElement("td");
			let col2 = document.createElement("td");
			let col3 = document.createElement("td");
			let icon = document.createElement("i");
			icon.className = "fa fa-bus";
			col2.innerText = this.busTimes[i].busNumber;
			col3.innerText = this.busTimes[i].departureTime;
			col1.appendChild(icon);
			tr.appendChild(col1);
			tr.appendChild(col2);
			tr.appendChild(col3);
			table.appendChild(tr);
		}
		
		div.appendChild(table);
		return div;
	},

	createTableHeader: function() {
		let tr = document.createElement("tr");
		let col1 = document.createElement("th");
		let col2 = document.createElement("th");
		let col3 = document.createElement("th");
				
		col2.innerText = "#";
		col3.innerText = "Departure";
		
		tr.appendChild(col1);
		tr.appendChild(col2);
		tr.appendChild(col3);
		return tr;
	},

	getBusTimes: function() {
		var self = this;
		var retry = false;
		var url = `https://transportapi.com/v3/uk/bus/stop/${this.config.atocode}/live.json?app_id=${this.config.app_id}&app_key=${this.config.api_key}&group=no&nextbuses=no`
		var busTimesRequest = new XMLHttpRequest();
		busTimesRequest.open("GET", url, true);
		busTimesRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processBusTimes(JSON.parse(this.response));
				} else if (this.status === 403){
					Log.error(self.name + ":" + JSON.parse(this.response).error);
					self.scheduleNextCheck()
				}
			}
		};
		busTimesRequest.send();
	},

	processBusTimes: function (data) {
		this.header = `${data.stop_name}, ${data.locality}`;
		this.busTimes = [];
		if(data.departures.all){
			for(let i = 0; i < data.departures.all.length; i++) {
				let departure = data.departures.all[i];
				this.busTimes.push({
					date: departure.date,
					departureTime: departure.best_departure_estimate,
					busNumber: departure.line_name
				});
			}
		}	
		
		this.scheduleNextCheck(this.busTimes);
		this.updateDom(1000);
	},

	scheduleNextCheck: function(busTimes) {
		let nextCheck = 1200000;
		if(busTimes && busTimes.length > 0){
			const firstElement = busTimes[0];
			nextCheck = new Date(`${firstElement.date}T${firstElement.departureTime}`) - new Date();
		}

		setTimeout(() => {
			this.getBusTimes();
		}, nextCheck);
	}

	
})