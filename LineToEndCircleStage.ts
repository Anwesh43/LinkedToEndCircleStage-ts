const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5

class LineToEndCircleStage {
    canvas : HTMLCanvasElement  = document.createElement('canvas')
    context : CanvasRenderingContext2D
    lte : LineToEndCircle = new LineToEndCircle()
    animator : Animator = new Animator()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#bdbdbd'
        this.context.fillRect(0, 0, w, h)
        if (this.lte) {
            this.lte.draw(this.context)
        }
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.lte.startUpdating(() => {
                this.animator.start(() => {
                    this.render()
                    this.lte.update(() => {
                        this.animator.stop()
                        this.render()
                    })
                })
            })
        }
    }

    static init() {
        const stage : LineToEndCircleStage = new LineToEndCircleStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += 0.025 * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class LTENode {

    next : LTENode
    prev : LTENode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LTENode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        const gap : number = h / (nodes + 1)
        const r : number = gap / 3
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / 60
        context.strokeStyle = '#4CAF50'
        context.save()
        context.translate(w/2, this.i * gap + gap)
        for (var j = 0; j < 2; j++) {
            const sf : number = 1 - 2 * j
            const sc : number = Math.min(0.5, Math.max(this.state.scale - 0.5 * j, 0)) * 2
            const sc1 : number = Math.min(0.5, sc) * 2
            const sc2 : number = Math.min(0.5, Math.max(sc - 0.5, 0)) * 2
            context.save()
            context.scale(sf, 1)
            context.translate((w/2 - r) * sc2, 0)
            context.rotate(Math.PI * sc2)
            context.beginPath()
            for(var i = -90; i <= 90; i++) {
                const x = r * sc1 * Math.cos(i * Math.PI/180)
                const y = r * Math.sin(i * Math.PI/180)
                if (i == -90) {
                    context.moveTo(x, y)
                } else {
                    context.lineTo(x, y)
                }
            }
            context.stroke()
            context.restore()
        }
        context.restore()
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : LTENode {
        var curr : LTENode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LineToEndCircle {
    root : LTENode = new LTENode(0)
    curr : LTENode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}
