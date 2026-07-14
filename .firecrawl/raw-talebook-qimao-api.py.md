#!/usr/bin/python3
\# -\*- coding: UTF-8 -\*-

"""
七猫小说书籍信息获取接口
仅用于获取书籍信息（详情、目录、搜索），不含下载功能。
基于 https://github.com/shing-yu/7mao-novel-downloader 的签名逻辑。
"""

import hashlib
import logging
import random

import requests

from webserver.i18n import \_

QIMAO\_ISBN = "0000000000004" # 七猫小说专用 ISBN 占位符
KEY = "QimaoNovel"

\# ============================================================
\# 签名配置（与 SLQimao 核心一致）
\# ============================================================

SIGN\_KEY = "d3dGiJc651gSQ8w1"

VERSION\_LIST = \[\
 "73720",\
 "73700",\
 "73620",\
 "73600",\
 "73500",\
 "73420",\
 "73400",\
 "73328",\
 "73325",\
 "73320",\
 "73300",\
 "73220",\
 "73200",\
 "73100",\
 "73000",\
 "72900",\
 "72820",\
 "72800",\
 "70720",\
 "62010",\
 "62112",\
\]

API\_TIMEOUT = 15

CHROME\_HEADERS = {
 "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.6",
 "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,\*/\*;q=0.8",
 "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko)"
 \+ "Chrome/66.0.3359.139 Safari/537.36",
}

\# ============================================================
\# 签名工具函数
\# ============================================================

def \_sign\_params(params: dict) -> dict:
 """对参数字典进行 MD5 签名（params key 排序后拼接 + key）"""
 keys = sorted(params.keys())
 sign\_str = "".join(k + "=" + str(params\[k\]) for k in keys) + SIGN\_KEY
 params\["sign"\] = hashlib.md5(sign\_str.encode()).hexdigest()
 return params

def \_make\_headers(book\_id: str) -> dict:
 """生成带签名的请求头（使用 book\_id 作为随机种子选择 app-version）"""
 random.seed(book\_id)
 version = random.choice(VERSION\_LIST)
 headers = {
 "AUTHORIZATION": "",
 "app-version": version,
 "application-id": "com.\*\*\*\*.reader",
 "channel": "unknown",
 "net-env": "1",
 "platform": "android",
 "qm-params": "",
 "reg": "0",
 }
 keys = sorted(headers.keys())
 sign\_str = "".join(k + "=" + str(headers\[k\]) for k in keys) + SIGN\_KEY
 headers\["sign"\] = hashlib.md5(sign\_str.encode()).hexdigest()
 return headers

\# ============================================================
\# API 封装
\# ============================================================

class QimaoNovelApi:
 """七猫小说元数据获取 API"""

 def \_\_init\_\_(self, copy\_image=True, manual\_select=False):
 self.copy\_image = copy\_image
 self.manual\_select = manual\_select

 def search\_books(self, keyword: str, page: int = 1) -> list:
 """搜索书籍，返回结果列表"""
 params = \_sign\_params(
 {
 "extend": "",
 "tab": "0",
 "gender": "0",
 "refresh\_state": "8",
 "page": str(page),
 "wd": keyword,
 "is\_short\_story\_user": "0",
 }
 )
 headers = \_make\_headers("00000000")
 try:
 resp = requests.get(
 "https://api-bc.wtzw.com/search/v1/words",
 params=params,
 headers=headers,
 timeout=API\_TIMEOUT,
 )
 data = resp.json()
 book\_list = data.get("data", {}).get("book\_list", \[\])
 if not book\_list:
 # 兼容另一种字段名
 book\_list = data.get("data", {}).get("ret\_data", \[\])
 return book\_list or \[\]
 except Exception as e:
 logging.error(\_("七猫小说搜索异常：%s") % e)
 return \[\]

 def get\_book\_detail(self, book\_id: str) -> dict:
 """获取书籍详情，返回 data 字段的内容"""
 params = \_sign\_params({"id": book\_id})
 headers = \_make\_headers(book\_id)
 try:
 resp = requests.get(
 "https://api-bc.wtzw.com/api/v1/reader/detail",
 params=params,
 headers=headers,
 timeout=API\_TIMEOUT,
 )
 data = resp.json()
 return data.get("data", {}) or {}
 except Exception as e:
 logging.error(\_("七猫小说获取详情异常：%s") % e)
 return {}

 def get\_book\_by\_id(self, book\_id: str):
 """根据书籍 ID 获取元数据，返回 Metadata 对象或 None"""
 detail = self.get\_book\_detail(book\_id)
 if not detail:
 return None
 return self.\_metadata(book\_id, detail)

 def get\_book(self, title, author=None):
 """根据书名搜索并返回最佳匹配的 Metadata 对象"""
 keyword = f"{title} {author}" if author else title
 results = self.search\_books(keyword)
 if not results:
 return None

 # 优先精确匹配书名
 for item in results:
 item\_title = item.get("book\_name") or item.get("title", "")
 item\_author = item.get("author\_name") or item.get("author", "")
 if item\_title == title:
 if not author or item\_author == author:
 book\_id = str(item.get("book\_id", ""))
 if book\_id:
 return self.get\_book\_by\_id(book\_id)

 # 没有精确匹配则用第一条结果
 first = results\[0\]
 book\_id = str(first.get("book\_id", ""))
 if book\_id:
 return self.get\_book\_by\_id(book\_id)
 return None

 def \_metadata(self, book\_id: str, detail: dict):
 """将 API 返回的书籍详情转换为 Calibre Metadata 对象"""
 from calibre.ebooks.metadata.book.base import Metadata
 from calibre.utils.date import utcnow

 title = detail.get("book\_name") or detail.get("title", "")
 if not title:
 return None

 mi = Metadata(title)

 author = detail.get("author\_name") or detail.get("author", "佚名")
 mi.authors = \[author\]
 mi.author = author
 mi.author\_sort = author

 mi.publisher = None
 mi.isbn = QIMAO\_ISBN

 # 标签：可能是字符串（逗号分隔）或列表
 raw\_tags = detail.get("category\_name") or detail.get("tags", "")
 if isinstance(raw\_tags, list):
 mi.tags = raw\_tags\[:8\]
 elif isinstance(raw\_tags, str) and raw\_tags:
 mi.tags = \[t.strip() for t in raw\_tags.replace("，", ",").split(",") if t.strip()\]\[:8\]
 else:
 mi.tags = \[\]

 mi.comments = detail.get("abstract") or detail.get("summary", "")
 mi.pubdate = utcnow()
 mi.timestamp = mi.pubdate

 cover\_url = detail.get("thumb\_url") or detail.get("cover", "")
 mi.cover\_url = cover\_url
 mi.cover\_data = self.get\_cover(cover\_url)

 mi.website = f"https://www.qimao.com/shuku/{book\_id}/"
 mi.source = "七猫小说"
 mi.provider\_key = KEY
 mi.provider\_value = str(book\_id)
 mi.series = None
 mi.rating = None

 logging.debug("七猫小说 metadata:\\n%s" % mi)
 return mi

 def get\_cover(self, cover\_url):
 """下载封面图片，返回 (格式, 二进制数据) 或 None"""
 if not self.copy\_image or not cover\_url:
 return None
 try:
 rsp = requests.get(cover\_url, timeout=10, headers=CHROME\_HEADERS)
 if rsp.status\_code != 200:
 logging.error(\_("七猫小说获取封面失败：status\_code\[%d\] != 200") % rsp.status\_code)
 return None
 img = rsp.content
 if not img:
 return None
 img\_fmt = cover\_url.split(".")\[-1\].lower().split("?")\[0\]
 if img\_fmt not in \["jpg", "jpeg", "png", "gif", "webp"\]:
 img\_fmt = "jpg"
 return (img\_fmt, img)
 except Exception as e:
 logging.warning(\_("七猫小说获取封面失败：%s") % e)
 return None

def get\_qimao\_metadata(mi):
 """获取七猫小说元数据的便捷函数"""
 api = QimaoNovelApi()
 try:
 if hasattr(mi, "qimao\_id") and mi.qimao\_id:
 return api.get\_book\_by\_id(mi.qimao\_id)
 author = getattr(mi, "author\_sort", None) or getattr(mi, "author", None)
 return api.get\_book(mi.title, author)
 except Exception as e:
 logging.error("七猫小说接口异常：%s" % e)
 return None