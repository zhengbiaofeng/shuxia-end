#!/usr/bin/env pytest
\# -\*- coding: UTF-8 -\*-

"""
七猫小说元数据获取插件测试用例
"""

import logging
import os
import sys
import unittest
from unittest import mock

testdir = os.path.realpath(os.path.dirname(os.path.realpath(\_\_file\_\_)) + "/../../../")
sys.path.append(testdir)

import webserver.main
from webserver.plugins.meta.qimao.api import (
 KEY,
 QIMAO\_ISBN,
 QimaoNovelApi,
 \_make\_headers,
 \_sign\_params,
 get\_qimao\_metadata,
)

webserver.main.init\_calibre()

\# 七猫小说测试数据
QIMAO\_BOOK\_ID = "12345678"

QIMAO\_DETAIL\_RESPONSE = {
 "code": 0,
 "data": {
 "book\_id": QIMAO\_BOOK\_ID,
 "book\_name": "斗破苍穹",
 "author\_name": "天蚕土豆",
 "abstract": "这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！",
 "thumb\_url": "https://example.com/cover.jpg",
 "category\_name": "玄幻,热血",
 },
}

QIMAO\_SEARCH\_RESPONSE = {
 "code": 0,
 "data": {
 "book\_list": \[\
 {\
 "book\_id": QIMAO\_BOOK\_ID,\
 "book\_name": "斗破苍穹",\
 "author\_name": "天蚕土豆",\
 "abstract": "这里是属于斗气的世界。",\
 "thumb\_url": "https://example.com/cover.jpg",\
 },\
 {\
 "book\_id": "99999999",\
 "book\_name": "斗破苍穹外传",\
 "author\_name": "其他作者",\
 "abstract": "外传故事。",\
 "thumb\_url": "https://example.com/cover2.jpg",\
 },\
 \]
 },
}

class TestSignUtils(unittest.TestCase):
 """签名工具函数测试"""

 def test\_sign\_params(self):
 """测试参数签名生成"""
 params = {"id": "12345"}
 result = \_sign\_params(params)
 self.assertIn("sign", result)
 self.assertEqual(len(result\["sign"\]), 32) # MD5 hexdigest 长度

 def test\_sign\_params\_deterministic(self):
 """相同输入产生相同签名"""
 params1 = {"id": "12345", "page": "1"}
 params2 = {"id": "12345", "page": "1"}
 \_sign\_params(params1)
 \_sign\_params(params2)
 self.assertEqual(params1\["sign"\], params2\["sign"\])

 def test\_make\_headers(self):
 """测试请求头生成"""
 headers = \_make\_headers("12345678")
 self.assertIn("sign", headers)
 self.assertIn("app-version", headers)
 self.assertIn("platform", headers)
 self.assertEqual(headers\["platform"\], "android")
 self.assertEqual(len(headers\["sign"\]), 32)

 def test\_make\_headers\_deterministic(self):
 """相同 book\_id 产生相同请求头（随机种子固定）"""
 h1 = \_make\_headers("12345678")
 h2 = \_make\_headers("12345678")
 self.assertEqual(h1\["sign"\], h2\["sign"\])
 self.assertEqual(h1\["app-version"\], h2\["app-version"\])

class TestQimaoNovelApi(unittest.TestCase):
 """七猫小说 API 测试类"""

 def test\_constants(self):
 """测试常量定义"""
 self.assertEqual(KEY, "QimaoNovel")
 self.assertEqual(QIMAO\_ISBN, "0000000000004")

 def test\_api\_init(self):
 """测试 API 初始化"""
 api = QimaoNovelApi()
 self.assertTrue(api.copy\_image)
 self.assertFalse(api.manual\_select)

 api = QimaoNovelApi(copy\_image=False, manual\_select=True)
 self.assertFalse(api.copy\_image)
 self.assertTrue(api.manual\_select)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_search\_books(self, mk):
 """测试搜索功能"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = QIMAO\_SEARCH\_RESPONSE
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 results = api.search\_books("斗破苍穹")

 self.assertEqual(len(results), 2)
 self.assertEqual(results\[0\]\["book\_name"\], "斗破苍穹")
 self.assertEqual(results\[0\]\["book\_id"\], QIMAO\_BOOK\_ID)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_search\_books\_empty(self, mk):
 """测试搜索无结果"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = {"code": 0, "data": {"book\_list": \[\]}}
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 results = api.search\_books("不存在的书名xyz")
 self.assertEqual(results, \[\])

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_search\_books\_exception(self, mk):
 """测试搜索网络异常"""
 mk.side\_effect = Exception("网络错误")

 api = QimaoNovelApi(copy\_image=False)
 results = api.search\_books("斗破苍穹")
 self.assertEqual(results, \[\])

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_detail(self, mk):
 """测试获取书籍详情"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = QIMAO\_DETAIL\_RESPONSE
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 detail = api.get\_book\_detail(QIMAO\_BOOK\_ID)

 self.assertEqual(detail\["book\_name"\], "斗破苍穹")
 self.assertEqual(detail\["author\_name"\], "天蚕土豆")

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_detail\_exception(self, mk):
 """测试获取详情网络异常"""
 mk.side\_effect = Exception("网络错误")

 api = QimaoNovelApi(copy\_image=False)
 detail = api.get\_book\_detail(QIMAO\_BOOK\_ID)
 self.assertEqual(detail, {})

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_by\_id(self, mk):
 """测试根据 ID 获取书籍元数据"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = QIMAO\_DETAIL\_RESPONSE
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 mi = api.get\_book\_by\_id(QIMAO\_BOOK\_ID)

 self.assertIsNotNone(mi)
 self.assertEqual(mi.title, "斗破苍穹")
 self.assertEqual(mi.authors, \["天蚕土豆"\])
 self.assertEqual(mi.isbn, QIMAO\_ISBN)
 self.assertEqual(mi.source, "七猫小说")
 self.assertEqual(mi.provider\_key, KEY)
 self.assertEqual(mi.provider\_value, QIMAO\_BOOK\_ID)
 self.assertIsNone(mi.publisher)
 self.assertIsNone(mi.rating)
 self.assertIn("玄幻", mi.tags)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_by\_id\_not\_found(self, mk):
 """测试 ID 不存在时返回 None"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = {"code": 0, "data": {}}
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 mi = api.get\_book\_by\_id("invalid\_id")
 self.assertIsNone(mi)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_exact\_match(self, mk):
 """测试书名精确匹配逻辑"""
 # 第一次调用：搜索；第二次调用：详情
 search\_resp = mock.Mock()
 search\_resp.status\_code = 200
 search\_resp.json.return\_value = QIMAO\_SEARCH\_RESPONSE

 detail\_resp = mock.Mock()
 detail\_resp.status\_code = 200
 detail\_resp.json.return\_value = QIMAO\_DETAIL\_RESPONSE

 mk.side\_effect = \[search\_resp, detail\_resp\]

 api = QimaoNovelApi(copy\_image=False)
 mi = api.get\_book("斗破苍穹", "天蚕土豆")

 self.assertIsNotNone(mi)
 self.assertEqual(mi.title, "斗破苍穹")

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_book\_no\_results(self, mk):
 """测试搜索无结果时返回 None"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = {"code": 0, "data": {"book\_list": \[\]}}
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 mi = api.get\_book("不存在的书名xyz")
 self.assertIsNone(mi)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_cover(self, mk):
 """测试封面下载"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.content = b"fake\_image\_data"
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=True)
 result = api.get\_cover("https://example.com/cover.jpg")

 self.assertIsNotNone(result)
 self.assertEqual(result\[0\], "jpg")
 self.assertEqual(result\[1\], b"fake\_image\_data")

 def test\_get\_cover\_disabled(self):
 """测试 copy\_image=False 时不下载封面"""
 api = QimaoNovelApi(copy\_image=False)
 result = api.get\_cover("https://example.com/cover.jpg")
 self.assertIsNone(result)

 def test\_get\_cover\_no\_url(self):
 """测试 URL 为空时不下载封面"""
 api = QimaoNovelApi(copy\_image=True)
 self.assertIsNone(api.get\_cover(""))
 self.assertIsNone(api.get\_cover(None))

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_get\_cover\_http\_error(self, mk):
 """测试封面下载 HTTP 错误"""
 mock\_response = mock.Mock()
 mock\_response.status\_code = 404
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=True)
 result = api.get\_cover("https://example.com/cover.jpg")
 self.assertIsNone(result)

 @mock.patch("webserver.plugins.meta.qimao.api.requests.get")
 def test\_metadata\_tags\_string(self, mk):
 """测试标签字段为字符串时的解析"""
 detail\_with\_string\_tag = {
 "code": 0,
 "data": {
 "book\_id": QIMAO\_BOOK\_ID,
 "book\_name": "测试书",
 "author\_name": "作者",
 "abstract": "简介",
 "thumb\_url": "",
 "category\_name": "玄幻,热血,修仙",
 },
 }
 mock\_response = mock.Mock()
 mock\_response.status\_code = 200
 mock\_response.json.return\_value = detail\_with\_string\_tag
 mk.return\_value = mock\_response

 api = QimaoNovelApi(copy\_image=False)
 mi = api.get\_book\_by\_id(QIMAO\_BOOK\_ID)

 self.assertIsNotNone(mi)
 self.assertIn("玄幻", mi.tags)
 self.assertIn("热血", mi.tags)
 self.assertIn("修仙", mi.tags)

 @mock.patch("webserver.plugins.meta.qimao.api.QimaoNovelApi.get\_book")
 def test\_get\_qimao\_metadata(self, mk):
 """测试便捷函数 get\_qimao\_metadata"""
 mock\_mi\_result = mock.Mock()
 mock\_mi\_result.title = "斗破苍穹"
 mk.return\_value = mock\_mi\_result

 input\_mi = mock.Mock()
 input\_mi.title = "斗破苍穹"
 input\_mi.author\_sort = "天蚕土豆"
 del input\_mi.qimao\_id

 result = get\_qimao\_metadata(input\_mi)
 self.assertIsNotNone(result)
 mk.assert\_called\_once()

if \_\_name\_\_ == "\_\_main\_\_":
 logging.basicConfig(
 level=logging.DEBUG,
 format="%(levelname)5s %(pathname)s:%(lineno)d %(message)s",
 )
 unittest.main()