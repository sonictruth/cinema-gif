/*
Requires: FFmpeg + ImageMagick 
*/
var fs = require('fs');
var sys = require('sys');
var path = require('path')
var exec = require('child_process').exec;
var parser = require('./parser'); // srt parser

// TODO: make a module
var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// setup filenames / paths
var fileName = 'Bad.Words.2013.720p.BluRay.x264.YIFY.mp4';  // TODO: read from process.argv[2];
var fileNameNoExt =  fileName.substr(0, fileName.lastIndexOf("."));
var invid = __dirname + path.sep + fileName;
var insub = __dirname + path.sep + fileNameNoExt + '.srt';
var outdir = __dirname + path.sep + fileNameNoExt + path.sep;


if(typeof fileName === 'undefined'){
	console.log('Specify a file.');
	process.exit(1);
} else{
	console.log("Processing: ", insub, invid );
}

var srt = fs.readFileSync(insub);
var data = parser.fromSrt(srt);


deleteFolderRecursive(outdir);
fs.mkdirSync(outdir);


function processSubtitles(next){

	if(!data[next]) return;

	var l = data[next];
	var id = l.id;
	var st = l.startTime.replace(',','.');
	var et = l.endTime.replace(',','.');
	var txt = l.text;
	
	var cdir = outdir + l.id + path.sep ;
	var outvid = cdir + 'seq%03d.png';
	var gifvid = outdir + l.id + '.gif'; 

    fs.mkdirSync(cdir);
    
    var ff = 'ffmpeg -i '+invid+' -ss '+st+' -to '+et+'  -vf subtitles='+insub +',scale=480:-1 -an -r 8 '+ outvid; //TODO: use some kind of sprintf     
    exec(ff, function (error, stdout, stderr) {
    	console.log(stdout,stderr);    	    	
    	if (error !== null) {
    		console.log('FFMpeg Error: ' + error);    		 
    	} else {
			var im = 'convert '+cdir+'*.png -delay 1x8 -fuzz 4% -coalesce +dither  +map -matte -depth 8 -deconstruct  -layers OptimizeTransparency  -colors 120 ' + gifvid;
    		exec(im, function (error, stdout, stderr) {
    			console.log(stdout,stderr);    	
    			if (error !== null) {
    				console.log('ImageMagik Error: ' + error);    		 
    			} else {    				
    				next++;
    				processSubtitles(next);	
    			}    	
    		});      		    		
    	}    	
    });   
}

processSubtitles(0);
