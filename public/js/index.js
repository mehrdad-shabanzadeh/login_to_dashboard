let ctx = document.getElementById('myChart').getContext('2d');

// Get total cases of covid-19 for iran
let covidApi = 'https://api.thevirustracker.com/free-api?countryTimeline=ir';
axios
	.get(covidApi)
	.then((result) => {
		// Get each day object
		let daysObj = result.data.timelineitems[0];
		let xlabels = [];
		let data = [];

		// loop through the api
		for (let day in daysObj) {
			// take total_cases property of each day
			let totalCases = daysObj[day].total_cases;

			// labels of x-axis (each day)
			xlabels.push(day);

			// data array, total cases day by day
			data.push(totalCases);

			// Create the chart
			new Chart(ctx, {
				type: 'line',
				data: {
					labels: xlabels,
					datasets: [
						{
							label: 'Total cases of corona virus in Iran',
							data: data,
							borderColor: 'red',
						},
					],
				},
			});
		}
	})
	.catch((err) => console.log(err));
