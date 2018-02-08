var app = getApp()

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    image: {
      type: String,
      value: '',
      observer: function (val) {
        console.log('更新', val)
        // 把图导入画布
        var ctx = wx.createCanvasContext('myCanvas')
        ctx.rect(10, 10, 150, 75)
        ctx.setFillStyle('red')
        ctx.fill()
        ctx.draw()
      }
    }
  },
  attached: function () {
    const ctx = wx.createCanvasContext('myCanvas')
    console.log('ctx', ctx)

    ctx.setFontSize(20)
    ctx.fillText('Hello', 20, 20)
    ctx.fillText('MINA', 100, 100)

    ctx.draw()
  },
  data: {
  },
  methods:{
    cancel: function () {
      this.setData({
        show: false
      })
    }
  }
})