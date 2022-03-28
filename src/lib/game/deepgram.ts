export const startTransription = async (cb: (transcript: string) => void) => {
	const audioStream = await navigator.mediaDevices.getUserMedia({
		audio: true
	});
	const audioRecorder = new MediaRecorder(audioStream, {
		mimeType: 'audio/webm'
	});

	const sock = new WebSocket(`wss://api.deepgram.com/v1/listen`, [
		'token',
		'da3b12e84e3ccef9b6c67011ca2c44da8883f025'
	]);

	sock.onopen = () => {
		audioRecorder.addEventListener('dataavailable', async (evt) => {
			if (evt.data.size > 0 && sock.readyState === 1) sock.send(evt.data);
		});
		audioRecorder.start(0.01 * 1000);
	};

	sock.onmessage = ({ data }) => {
		const msg = JSON.parse(data);
		const transcript = msg.channel.alternatives[0].transcript;
		if (transcript && msg.is_final) {
			cb(transcript);
		}
	};

	sock.onclose = () => {
		audioStream.getAudioTracks().forEach((track) => track.stop());
		audioRecorder.stop();
	};

	return sock;
};
