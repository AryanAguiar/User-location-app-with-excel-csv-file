// Initialize the map
var map = L.map('map').setView([20.5937, 78.9629], 5);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var markers = [];
var polyline;  // Store the polyline reference

// Function to clear previous data
function clearPreviousData() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];  // Clear the markers array

    // Remove the polyline if it exists
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;  // Reset the polyline variable
    }
}

// Function to format date
function formatDate(dateString) {
    if (!isNaN(dateString)) {
        let excelDate = new Date((dateString - 25569) * 86400 * 1000); // Convert Excel date to JavaScript date
        return formatDateFromJS(excelDate);
    } else {
        let date = new Date(dateString); // Attempt to parse date string
        return formatDateFromJS(date);
    }
}

function formatDateFromJS(date) {
    let day = ("0" + date.getDate()).slice(-2); // Ensure two digits
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are 0-indexed
    let year = date.getFullYear();
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    let seconds = ("0" + date.getSeconds()).slice(-2);

    return `${day}-${month}-${year}  ${hours}:${minutes}:${seconds}`;
}

// Function to take in CSV/excel file
document.getElementById('fileInput').addEventListener('change', function (event) {
    clearPreviousData(); // Clear old markers and polyline

    var file = event.target.files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });

        var sheetname = workbook.SheetNames[0];
        var sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetname]);

        let coordinates = [];

        // Focus map on the first row if applicable
        if (sheet.length > 0) {
            let firstRow = sheet[0];
            if (firstRow.CartLatitude && firstRow.CartLongitude) {
                let firstlat = parseFloat(firstRow.CartLatitude);
                let firstlong = parseFloat(firstRow.CartLongitude);
                if (!isNaN(firstlat) && !isNaN(firstlong)) {
                    map.setView([firstlat, firstlong], 20);
                }
            }
        }

        // Loop through all rows to add markers and store coordinates
        sheet.forEach(row => {
            if (row.CartLatitude && row.CartLongitude) {
                let lat = parseFloat(row.CartLatitude);
                let long = parseFloat(row.CartLongitude);

                if (!isNaN(lat) && !isNaN(long)) {
                    coordinates.push([lat, long]);

                    let formattedDate = row.EntryDate ? formatDate(row.EntryDate) : "No date found";

                    // Create popup content
                    let popupContent = `<b>${row.UserName || "Unknown"}</b><br>
                                        ${formattedDate}<br>
                                        ${row.CartAddress || "No cart address provided"}<br>
                                        ${row.Remarks || "No remarks"}`;

   
                    let marker = L.marker([lat, long])
                        .addTo(map)
                        .bindPopup(popupContent);

                    markers.push(marker); 
                }
            }
        });

        if (coordinates.length > 1) {
            polyline = L.polyline(coordinates, { color: 'red', weight: 4, opacity: 0.7 }).addTo(map);
        }
    };

    reader.readAsArrayBuffer(file);
});
