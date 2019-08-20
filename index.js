var Board = {
  tagJson: {},
  tagArr: [],
  attrJson: [],
  attrMeta: {},
  record: {},
  storage: {},
  titleArr: [],
  type: '',
  format: {
    key: 'key', // 标签
    value: 'value', // 属性
    originCost: 'originCost', // 原价
    vipCost: 'vipCost', // 会员价
    interests: 'interests', // 权益
  },
  selectDom: null,
  recordItemDom: null,
  modalDom: $('#modal'),
  inputDom: $('#input'),
  tagListDom: $('#tag-list'),
  recordDom: $('#record'),
  recordHeaderDom: $('#record-header'),
  recordListDom: $('#record-list'),

  openModal: function (type, dom) { // 模态框打开
    Board.type = type
    Board.selectDom = dom
    Board.modalDom.show()
  },

  cancel: function () { // 模态框取消
    Board.modalDom.hide()
    Board.inputDom.val('')
  },

  confirm: function () { // 模态框确认
    var value = Board.inputDom.val()
    if (!value) {
      alert('请输入内容')
      return
    }
    switch (Board.type) {
      case 'tag':
        if (Board.tagArr.indexOf(value) > -1) {
          alert('已添加该标签')
          return
        }
        Board.createTag(value);
        break;
      case 'attr':
        if (Board.attrMeta[$(Board.selectDom).attr('uuid')].indexOf(value) > -1) {
          alert('已添加该属性')
          return
        }
        Board.createAttr(value);
        break;
    }
    Board.cancel()
  },

  createTag: function (tag) { // 添加属性栏
    var uuid = Board.uuid();
    Board.tagArr.push(tag)
    Board.tagJson[uuid] = tag
    Board.attrMeta[uuid] = []
    Board.tagListDom.append(function () {
      return [
        '<div class="line" tag="' + tag + '" uuid="' + uuid + '">',
        '<div class="pgleft">类型：</div>',
        '<div class="pgright">',
        '<div class="firtLable vt">',
        '<span class="sbs el-tag el-tag--light mt0">',
        '<span>' + tag + '</span>',
        '<img src="./icon_gb_tc@3x.png" ',
        'class="el-message-box__close close el-tag__close el-icon-close" ',
        'onclick="Board.removeTag(\'' + tag + '\', \'' + uuid + '\')" tag="' + tag + '" />',
        '</span>',
        '</div>',
        '<div class="zishuxing">',
        '<span class=" sbs el-tag el-tag--light sbs" onclick="Board.openModal(\'attr\', this)" tag="' + tag + '" uuid="' + uuid + '">+ New Tag</span>',
        '</div>',
        '</div>',
        '</div>',
      ].join('')
    })
    Board.addRecordTag(tag, uuid)
    //TODO 添加数据
  },

  removeTag: function (tag, uuid) { // 移除属性栏
    delete Board.tagJson[uuid]
    Board.tagArr.splice(Board.tagArr.indexOf(tag), 1)
    Board.tagListDom.find('[tag="' + tag + '"]').remove()
    Board.cleanRecordTag(tag, uuid)
    // 移除record对应栏
    //TODO 移除数据
  },

  createAttr: function (attr) { // 添加属性内容
    var dom = $(Board.selectDom)
    var uuid = Board.uuid()
    var tagUuid = dom.attr('uuid')
    Board.attrJson[uuid] = attr
    Board.attrMeta[tagUuid].push(attr)
    dom.before(function () {
      return [
        '<span class="sbs el-tag el-tag--light" id="' + uuid + '" attr="' + attr + '" tag="' + dom.attr('tag') + '" onclick="Board.selectAttr(this)" uuid="' + uuid + '" tagUuid="' + tagUuid + '">',
        '<span>' + attr + '</span>',
        '<img src="./icon_gb_tc@3x.png" ',
        'class="el-message-box__close close el-tag__close el-icon-close" ',
        'onclick="Board.removeAttr(this)" attr="' + attr + '" tag="' + dom.attr('tag') + '" uuid="' + uuid + '" tagUuid="' + tagUuid + '"/>',
        '</span>',
        // '<div onclick="Board.selectTag()" tag="',
      ].join('')
    })
    //TODO 添加数据
  },

  removeAttr: function (dom, event) { // 移除属性单一内容
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    var attr = $(dom).attr('attr')
    var tag = $(dom).attr('tag')
    var tagUuid = $(dom).attr('tagUuid')
    var uuid = $(dom).attr('uuid')

    delete Board.attrJson[uuid]
    Board.attrMeta[tagUuid].splice(Board.attrMeta[tagUuid].indexOf(attr), 1)
    for (var recordUuid in Board.record) {
      if (Board.record[recordUuid][tagUuid] == uuid) {
        Board.record[recordUuid][tagUuid] = null
      }
    }

    if (tagUuid in Board.storage && Board.storage[tagUuid] == uuid) {
      delete Board.storage[tagUuid]
    }
    $(dom).parent().remove();
    Board.cleanRecordAttr(tag, attr)
  },

  createRecord: function () { // 添加单条记录
    if (Board.tagArr.length == 0) {
      return
    }
    if (Board.tagArr.length != Board.getStorageCount()) {
      alert('请选择完所有的属性')
      return
    }
    var flag = false
    var num = 0
    for (var recordUuid in Board.record) {
      num++
      var mark = true
      var record = Board.record[recordUuid]
      for (var tagUuid in Board.storage) {
        mark = mark && Board.storage[tagUuid] == record[tagUuid]
      }
      flag = flag || mark
    }
    if (flag && num > 0) {
      $('.tag-active').each(function () {
        $(this).removeClass('tag-active')
      })
      alert('数据重复')
      return
    }
    var uuid = Board.uuid()
    Board.recordListDom.append(function () {
      return [
        '<tr onclick="Board.selectRecord(this, \'' + uuid + '\')" id="' + uuid + '" uuid="' + uuid + '">',
        Board.setRecordHtml(uuid),
        '<td class="originCost"><input type="text" class="el-input__inner w100" onblur="Board.isNum(this)" onchange="Board.getOriginCost(this, \'' + uuid + '\')"></td>',
        '<td class="vipCost"><input type="text" class="el-input__inner w100" onblur="Board.isNum(this)" onchange="Board.getVipCost(this, \'' + uuid + '\')"></td>',
        '<td class="interests"><input type="text" class="el-input__inner w100" onchange="Board.getInterests(this, \'' + uuid + '\')"></td>',
        '<td class="cz">',
        '<span onclick="Board.removeRecord(\'' + uuid + '\')">删除</span>',
        '</td>',
        '</tr>',
      ].join('')
    })
    $('.tag-active').each(function () {
      $(this).removeClass('tag-active')
    })
    Board.storage = {}
  },

  setRecordHtml: function (uuid) { // 内部工具方法
    Board.record[uuid] = {
      originCost: null,
      vipCost: null,
      interests: null,
    }
    var html = ''
    for (let i = 0; i < Board.titleArr.length; i++) {
      html += '<td tag="' + Board.tagJson[Board.titleArr[i]] + '" tagUuid="' + Board.titleArr[i] + '" attr="' + Board.attrJson[Board.storage[Board.titleArr[i]]] + '">' + Board.attrJson[Board.storage[Board.titleArr[i]]] + '</td>'
      Board.record[uuid][Board.titleArr[i]] = Board.storage[Board.titleArr[i]]
    }
    return html
  },

  removeRecord: function (uuid) { // 移除单条记录
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    $('#' + uuid).remove();
    //TODO 移除数据
    delete Board.record[uuid]
  },

  addRecordTag: function (tag, uuid) { // 添加record tag
    Board.recordHeaderDom.children().eq(-4).before(function () {
      return [
        '<td tag="' + tag + '" tagUuid="' + uuid + '">' + tag + '</td>',
      ].join('')
    })
    Board.recordListDom.children().each(function () {
      $(this).children().eq(-4).before(function () {
        return [
          '<td tag="' + tag + '" tagUuid="' + uuid + '"></td>',
        ].join('')
      })
    })
    var titleArr = []
    Board.recordHeaderDom.find('[tagUuid]').each(function () {
      titleArr.push($(this).attr('tagUuid'))
    })
    Board.titleArr = titleArr
    for (var recordUuid in Board.record) {
      Board.record[recordUuid][uuid] = null
    }
  },

  cleanRecordTag: function (tag, uuid) { // 去除记录中的某个标记
    Board.recordHeaderDom.children().filter('[tag="' + tag + '"]').remove()
    Board.recordListDom.children().each(function () {
      $(this).children().filter('[tag="' + tag + '"]').remove()
    })
    var titleArr = []
    Board.recordHeaderDom.find('[tagUuid]').each(function () {
      titleArr.push($(this).attr('tagUuid'))
    })
    if (uuid in Board.storage) {
      delete Board.storage[uuid]
    }
    Board.titleArr = titleArr
    for (var recordUuid in Board.record) {
      delete Board.record[recordUuid][uuid]
    }
  },

  cleanRecordAttr: function (tag, attr) { // 去除记录中的某个属性
    Board.recordListDom.children().each(function () {
      $(this).find('[tag="' + tag + '"]').filter('[attr="' + attr + '"]').html('')
    })
  },

  selectRecord: function (dom, uuid) { // 选择单行记录
    $('.tag-active').each(function () {
      $(this).removeClass('tag-active')
    })
    if ($(dom).hasClass('active')) {
      $(dom).removeClass('active')
      Board.recordItemDom = null
      // Board.storage = {}
    } else {
      Board.recordListDom.children().each(function () {
        $(this).removeClass('active')
      })
      $(dom).addClass('active')
      for (var tag in Board.record[uuid]) {
        if (['originCost', 'vipCost', 'interests'].indexOf(tag) == -1) {
          $('#' + Board.record[uuid][tag]).addClass('tag-active')
        }
      }
      Board.recordItemDom = dom
    }
  },

  selectAttr: function (dom) { // 表格 添加属性
    var tagUuid = $(dom).attr('tagUuid')
    var uuid = $(dom).attr('uuid')
    if ($(dom).hasClass('tag-active')) {
      $(dom).removeClass('tag-active')
      delete Board.storage[tagUuid]
    } else {
      $(dom).parent().children().each(function () {
        $(this).removeClass('tag-active')
      })
      $(dom).addClass('tag-active')
      Board.storage[tagUuid] = uuid
    }

    if (Board.recordItemDom) {
      var tag = $(dom).attr('tag')
      var attr = $(dom).attr('attr')
      var recordUuid = $(Board.recordItemDom).attr('uuid')
      $(Board.recordItemDom).find('[tag="' + tag + '"]').html(attr).attr('attr', attr)
      Board.record[recordUuid][tagUuid] = uuid
    }
  },

  submit: function () {
    $('.warning').each(function () {
      $(this).removeClass('warning')
    })
    var mark = true
    for (var recordUuid in Board.record) {
      var record = Board.record[recordUuid]
      for (var key in record) {
        if (record[key] === null || record[key] === undefined) {
          if (['originCost', 'vipCost', 'interests'].indexOf(key) > -1) {
            $('#' + recordUuid).find('.' + key).addClass('warning')
          } else {
            $('#' + recordUuid).find('[tagUuid="' + key + '"]').addClass('warning')
          }
          mark = false
        }
      }
    }
    if (!mark) {
      alert('请将所有数据填写完整')
      return
    }
    return Board.getData()
  },

  uuid: function () {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  },

  getStorageCount: function () {
    var num = 0
    for (var key in Board.storage) {
      num++
    }
    return num
  },

  getOriginCost: function (dom, recordUuid) {
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    Board.record[recordUuid].originCost = $(dom).val()
  },

  getVipCost: function (dom, recordUuid) {
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    Board.record[recordUuid].vipCost = $(dom).val()
  },

  getInterests: function (dom, recordUuid) {
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    Board.record[recordUuid].interests = $(dom).val()
  },

  getData: function () {
    var data = []
    for (var recordUuid in Board.record) {
      var record = Board.record[recordUuid]
      var content = []
      for (var tagUuid in record) {
        var item = {}
        if (['originCost', 'vipCost', 'interests'].indexOf(tagUuid) == -1) {
          item[Board.format['key']] = Board.tagJson[tagUuid]
          item[Board.format['value']] = Board.attrJson[record[tagUuid]]
        } else {
          item[Board.format['key']] = Board.format[tagUuid]
          item[Board.format['value']] = record[tagUuid]
        }
        content.push(item)
      }
      data.push(content)
    }
    return data
  },

  isNum: function (dom) {
    window.event ? window.event.cancelBubble = true : event.stopPropagation();
    var re = /^([1-9]\d*(\.\d{1,2}){0,1}|0\.\d{1,2})$/
    if (dom) {
      num = $(dom).val()
    }
    if (!num) {
      return
    }
    if (!re.test(num)) {
      alert('请确认数字格式');
      if (dom) {
        $(dom).val('')
      }
      return false
    }
  }
}