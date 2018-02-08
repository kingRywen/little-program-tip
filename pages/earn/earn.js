var util = require('../../utils/util.js')


Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: '',
    year: '',
    mouth: '',
    earnList: [],
    income: '-',
    Withdrawals: '-',
    balance: '-',
    session: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {


    var date = util.formatTime(new Date()).split(' ')[0]
    console.log(date)
    this.setData({
      date: date,
      year: date.split('-')[0],
      mouth: date.split('-')[1]
    })

    // 获取收支详情
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetPayList',
          data: {
            session: res.data,
            time: date.split('-')[0] + '-' + date.split('-')[1] + '-' + '01'
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log(res.data)
            var lists = res.data
            this.calc(lists)
          }
        })
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetAccount',
          data: {
            session: res.data,
            // time: date.split('-')[0] + '-' + date.split('-')[1] + '-' + '01'
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log(res.data)
            this.setData({
              balance: util.formatMoney(res.data)
            })
          }
        })

        this.setData({
          session: res.data
        })
      },
    })
    
    
  },
  bindDateChange: function (e) {
    console.log('改变', e)
    var date = e.detail.value
    this.setData({
      date: date,
      year: date.split('-')[0],
      mouth: date.split('-')[1]
    })
    wx.request({
      url: 'https://www.drawing-attractions.com/Zan/GetPayList',
      data: {
        session: this.data.session,
        time: date.split('-')[0] + '-' + date.split('-')[1] + '-' + '01'
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log(res.data)
        var lists = res.data
        this.calc(lists)
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('刷新')
    let e = {
      detail: {
        value: this.data.date
      }
    }
    this.bindDateChange(e)
    wx.request({
      url: 'https://www.drawing-attractions.com/Zan/GetAccount',
      data: {
        session: this.data.session
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log(res.data)
        this.setData({
          balance: util.formatMoney(res.data)
        })
        wx.stopPullDownRefresh()
      }
    })

    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  calc: function (lists) {
    var income = 0, Withdrawals = 0
    for (var i = 0; i < lists.length; i++) {
      let element = lists[i]
      let arr = element.Time.split('T')
      let day = arr[0].split('-')[2]
      let time = arr[1].split('.')[0]
      if (element.Money > 0) {
        income += element.Money
      } else {
        Withdrawals += element.Money
      }
      element.formatMoney = util.formatMoney(element.Money)
      element.day = day
      element.time = time
      element.formatMoney = util.formatMoney(element.Money)
    }
    income = util.formatMoney(income)
    Withdrawals = util.formatMoney(-Withdrawals)
    this.setData({
      earnList: lists,
      income: income,
      Withdrawals: Withdrawals
    })
  }
})