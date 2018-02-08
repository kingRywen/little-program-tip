const app = getApp()

Component({
  properties: {
    isShow: {
      type: Boolean,
      value: false
    },
    val: {
      type: String,
      value: ''
    },
    prop: {
      type: String,
      value: ''
    },
    length: {
      type: Number,
      value: ''
    }
  },
  data: {
  },
  methods:{
    save: function () {
      this.triggerEvent('save', {
        prop: this.data.prop,
        val: this.data.val
      })
    },
    cancel: function () {
      this.triggerEvent('cancel', {})
    },
    change: function (e) {
      console.log(e)
      this.data.val = e.detail.value
    }
  }
})