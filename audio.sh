ffmpeg -f alsa -ac 1 -ar 44100 -i hw:1,0 -f mpegts -codec:a mp2 -b:a 128k -muxdelay 0.001 http://localhost:8081/supersecret