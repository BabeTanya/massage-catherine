class BaseVideoPlayer {
	async isPlaying() {
		throw new Error("Not Implemented")
	}

	async getCurrentTimestamp() {
		throw new Error("Not Implemented")
	}

	async getVideoLength() {
		throw new Error("Not Implemented")
	}

	async getWatchbarIdent() {
		throw new Error("Not Implemented")
	}

	async seekToSec(sec) {
		throw new Error("Not Implemented")
	}
}

function getPageContext() {
	return JSON.parse(document.getElementById("page-context").value)
}

class Watchbar {
	viewedSeg = null;
	savedSeg = null;
	currentSeg = null;

	constructor(player) {
		this.player = player
	}

	async setup() {

		if (getPageContext().video_completed) {
			this.viewedSeg = new Set()
			this.savedSeg = new Set([0])
			this.currentSeg = 0
			this.nSeg = 1
		} else {
			await this.populateProperties();
			setInterval(() => this.updateViewingSegment(), 250);
			setInterval(() => this.submitWatchProgress(), 10000);
		}
		setInterval(() => this.render(), 1000);
	}

	render() {
		const container = document.getElementById("watchbar-container");
		const canvas = document.getElementById("watchbar");
		const ctx  = canvas.getContext("2d");
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		const width = canvas.width;
		const height = canvas.height;

		ctx.lineWidth = 0;
		ctx.fillStyle = "grey"
		ctx.strokeStyle = "white"
		ctx.fillRect(0, 0, width, height);


		const get_box = (i) => {
			const w = width/this.nSeg;
			return [w * i, 0, w, height];
		}

		let lastPaintX = 0;
		let currentFillStyle = "black";
		for (let i = 0; i < this.nSeg; i++) {
			let nextFillStyle;
			if (this.savedSeg.has(i)) {
				nextFillStyle = "#A2FF00"
			} else if (this.viewedSeg.has(i)) {
				nextFillStyle = "lightgrey"
			} else {
				nextFillStyle = "grey"
			}

			if (nextFillStyle != currentFillStyle) {
				const [x, y, w, h] = get_box(i)
				ctx.fillStyle = currentFillStyle
				ctx.fillRect(lastPaintX, 0, x - lastPaintX, height)
				currentFillStyle = nextFillStyle
				lastPaintX = x
			}
		}
		ctx.fillStyle = currentFillStyle
		ctx.fillRect(lastPaintX, 0, width - lastPaintX, height)

		ctx.strokeRect(...get_box(this.currentSeg));
	}

	async populateProperties() {
		this.nSeg = Math.min(await Promise.resolve(this.player.getVideoLength()), 400)
		const watchbarIdent = await Promise.resolve(this.player.getWatchbarIdent());

		const response = await fetch("/?q=cvdlit/ajax/fetchwatchedbar", {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams(watchbarIdent)
		})
		const resp = await response.json()

		if (resp.status !== 1) {
			throw new Error("Watchbar data is broken")
		}

		this.savedSeg = new Set((resp.watched == null ? [] : resp.watched).map(e => parseInt(e.split('/')[0])))
		this.viewedSeg = new Set()
	}

	async updateViewingSegment() {
		const currentTime = await Promise.resolve(this.player.getCurrentTimestamp());
		const videoLength = await Promise.resolve(this.player.getVideoLength());
		const isPlaying = await Promise.resolve(this.player.isPlaying());

		const seg = Math.floor((currentTime / videoLength) * this.nSeg)
		this.currentSeg = seg
		if (isPlaying && !this.savedSeg.has(seg) && !this.viewedSeg.has(seg)) {
				this.viewedSeg.add(seg);
		}
	}

	async submitWatchProgress() {
		if (this.viewedSeg.size == 0) {
			return;
		}
		const watchbarIdent = await Promise.resolve(this.player.getWatchbarIdent());
		const resp = await fetch("/?q=cvdlit/ajax/recordbar", {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				 body: new URLSearchParams({...watchbarIdent, n: this.nSeg, i: JSON.stringify([...this.savedSeg, ...this.viewedSeg])})
			});
			const obj = await resp.json()
			if (obj.status !== 1) {
				throw new Error("Cannot recordbar")
			}
			this.viewedSeg = new Set([])
			this.savedSeg = new Set(obj.recordedbar)
	}
}

class Transcript {
	constructor(url, player) {
		this.url = url
		this.player = player
	}

	async setup() {
		const data = await fetch(this.url)
		const vttContent = await data.text()

		const parser = new WebVTT.Parser(window, WebVTT.StringDecoder())
		const cues = []
		parser.oncue = (cue) => cues.push(cue)
		parser.parse(vttContent)
		parser.flush()

		this.cues = cues.map((c, i) => this.parseCue(c, i))
		Alpine.store('script').transcript = this

	}

	parseCue(cue, idx) {
		function secs_format(s) {
			const seconds = Math.floor(s % 60)
			const minutes = Math.floor(s / 60)

			function padnum(n) {
				let s = n.toString()
				while (s.length < 2) {
					s = '0' + s
				}
				return s
			}

			return padnum(minutes) + ':' + padnum(seconds)
		}

		const seekTime = cue.startTime - 5 < 0 ? 0 : cue.startTime - 5

		return {
			time: secs_format(cue.startTime),
			html: cue.text,
			seek: () => this.player.seekToSec(seekTime),
			idx: idx,
			is_active: (time) => {
				return cue.startTime <= time && cue.endTime >= time
			}
		}
	}
}



/**
 * Called by player-specific code once embedded player finished initialization
 * player must extends BaseVideoPlayer
 */
async function registerPlayer(player) {
	try {
		const watchbar = new Watchbar(player);
		await watchbar.setup()
		Alpine.store('script').watchbarWarn = null
	} catch (e) {
		Alpine.store('script').watchbarWarn = "Watchbar Error:" + e.message
		console.error(e);
	}

	setInterval(() => Promise.resolve(player.getCurrentTimestamp()).then(t => Alpine.store('script').videoTime = t).catch(console.error), 250)

	const transcript_url = getPageContext().transcript_url
	if (transcript_url) {
		await (new Transcript(transcript_url, player)).setup()
	}
}

const transcriptPane = () => ({
	autoScroll: true,
	containerElement: null,
	targetScrollElement: null,
	lastProgrammaticScrollTop: null,
	scrollToTarget() {
		if (!this.targetScrollElement) {
			return;
		}
		const targetScroll = this.targetScrollElement.offsetTop - this.containerElement.offsetTop;
		this.containerElement.scrollTop = targetScroll;
		this.lastProgrammaticScrollTop = this.containerElement.scrollTop;
	},
	getActiveCue() {
		return this.containerElement.querySelector(".playlist-item-active");
	},
	reactivateAutoscroll() {
		this.autoScroll = true;
		this.scrollToTarget();
	},
	isCurrentScrollProgrammatic() {
		if (this.lastProgrammaticScrollTop === null)
			return true;
		return this.containerElement.scrollTop === this.lastProgrammaticScrollTop;
	},
	autoscrollingPane: {
		['x-init']() {
			this.containerElement = this.$el;

			setInterval(() => {
				// Set new active cue as target.
				let cue = this.getActiveCue();
				if (cue) {
					// Try two previous sibling for spacing.
					cue = cue.parentElement;
					for (let i = 0; i < 2; i++) {
						if (cue.previousElementSibling) {
							cue = cue.previousElementSibling;
						}
					}
					this.targetScrollElement = cue;
				}

				// Check if autoscroll is enabled.
				if (!this.autoScroll) {
					return;
				}
				// Check if user manually scroll
				if (!this.isCurrentScrollProgrammatic()) {
					this.autoScroll = false;
					return;
				}
				
				// Scroll to Target.
				this.scrollToTarget();
			}, 250);
		}
	},
	autoscrollActivateBtn: {
		['@click']() {
			this.reactivateAutoscroll();
		},
		['x-show']() {
			return !this.autoScroll
		}
	}
})

var Feedback = {
	cookieName: "feedback-dialog",
	get dialogShouldOpen() {
		return (document.cookie.split('; ').find(e => e.startsWith(this.cookieName + "="))?.split('=')[1] || "true") === "true";
	},
	set dialogShouldOpen(state) {
		let d = new Date();
		d.setDate(d.getDate() + 7);
		document.cookie = `${this.cookieName}=${state ? "true":"false"}; expires=${d.toUTCString()}`;
	},
	submit(e) {
		e.preventDefault();
		const data = new FormData(e.target);
		const request = new XMLHttpRequest();
		request.open("POST", "/?q=cvdlit/ajax/submitfeedback");
		request.send(data);
		console.log(data);
	}
}

document.addEventListener('alpine:init', () => {
		Alpine.store('script', {
			watchbarWarn: "Loading watchbar. Watch-progress recording has not yet started.",
			transcript: null,
			videoTime: 0,
		})

		Alpine.data('transcriptPane', transcriptPane)
})

function initTheater() {

}

document.addEventListener('DOMContentLoaded', initTheater);
