const http = require('http')
const fs = require('fs')
let server = http.createServer();

server.on('request', (req,res)=>{
	
	if(req.url.startsWith('/static')){
		
		fs.readFile('.' + req.url, (err,data) => {
			res.end(data);
		})
	} else {
		
		fs.readFile('./playback.html', (err,data) => {
			res.end(data);
		})
		
	}
	
})

server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');