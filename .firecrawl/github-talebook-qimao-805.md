[Skip to content](https://github.com/talebook/talebook/issues/805#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/talebook/talebook/issues/805) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/talebook/talebook/issues/805) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/talebook/talebook/issues/805) to refresh your session.Dismiss alert

{{ message }}

[talebook](https://github.com/talebook)/ **[talebook](https://github.com/talebook/talebook)** Public

- Sponsor







# Sponsor talebook/talebook























##### GitHub Sponsors

[Learn more about Sponsors](https://github.com/sponsors)







[![@talebook](https://avatars.githubusercontent.com/u/4410246?s=80&v=4)](https://github.com/talebook)



[talebook](https://github.com/talebook)



[talebook](https://github.com/talebook)



[Sponsor](https://github.com/sponsors/talebook)









##### External links









[https://paypal.me/rexliao](https://paypal.me/rexliao)









[Learn more about funding links in repositories](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).




[Report abuse](https://github.com/contact/report-abuse?report=talebook%2Ftalebook+%28Repository+Funding+Links%29)

- [Notifications](https://github.com/login?return_to=%2Ftalebook%2Ftalebook) You must be signed in to change notification settings
- [Fork\\
606](https://github.com/login?return_to=%2Ftalebook%2Ftalebook)
- [Star\\
5.6k](https://github.com/login?return_to=%2Ftalebook%2Ftalebook)


# 希望支持七猫免费小说源\#805

[New issue](https://github.com/login?return_to=https://github.com/talebook/talebook/issues/805)

Copy link

[New issue](https://github.com/login?return_to=https://github.com/talebook/talebook/issues/805)

Copy link

Closed

[#806](https://github.com/talebook/talebook/pull/806)

Closed

[希望支持七猫免费小说源](https://github.com/talebook/talebook/issues/805#top)#805

[#806](https://github.com/talebook/talebook/pull/806)

Copy link

Labels

[featurenew features todo](https://github.com/talebook/talebook/issues?q=state%3Aopen%20label%3A%22feature%22) new features todo

## Description

[![@hehetoshang](https://avatars.githubusercontent.com/u/127867059?u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4&size=48)](https://github.com/hehetoshang)

[hehetoshang](https://github.com/hehetoshang)

opened [on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#issue-4655567275)

Last edited by hehetoshang

Collaborator

Issue body actions

# 背景：什么情况下需要这个功能

获取书籍信息没有七猫免费小说源

# 需求：想要做成什么样子

加入七猫免费小说源，以下是事例的获取代码：

```
"""
七猫小说书籍信息获取接口
仅用于获取书籍信息（详情、目录、搜索），不含下载功能。
基于 https://github.com/shing-yu/7mao-novel-downloader 的签名逻辑。

Usage:
    python 7mao.py search <keyword> [page]
    python 7mao.py detail <book_id>
    python 7mao.py catalog <book_id>
"""

import hashlib
import random
import json
import sys

import requests

# ============================================================
# 签名配置（与 SLQimao 核心一致）
# ============================================================

SIGN_KEY = "d3dGiJc651gSQ8w1"

VERSION_LIST = [\
    "73720", "73700",\
    "73620", "73600",\
    "73500",\
    "73420", "73400",\
    "73328", "73325", "73320", "73300",\
    "73220", "73200",\
    "73100", "73000", "72900",\
    "72820", "72800",\
    "70720", "62010", "62112",\
]

PROXIES = {"http": None, "https": None}

API_TIMEOUT = 15

# ============================================================
# 签名工具函数
# ============================================================

def _sign_params(params: dict) -> dict:
    """对参数字典进行 MD5 签名（params key 排序后拼接 + key）"""
    keys = sorted(params.keys())
    sign_str = "".join(k + "=" + str(params[k]) for k in keys) + SIGN_KEY
    params["sign"] = hashlib.md5(sign_str.encode()).hexdigest()
    return params

def _make_headers(book_id: str) -> dict:
    """生成带签名的请求头（使用 book_id 作为随机种子选择 app-version）"""
    random.seed(book_id)
    version = random.choice(VERSION_LIST)
    headers = {
        "AUTHORIZATION": "",
        "app-version": version,
        "application-id": "com.****.reader",
        "channel": "unknown",
        "net-env": "1",
        "platform": "android",
        "qm-params": "",
        "reg": "0",
    }
    keys = sorted(headers.keys())
    sign_str = "".join(k + "=" + str(headers[k]) for k in keys) + SIGN_KEY
    headers["sign"] = hashlib.md5(sign_str.encode()).hexdigest()
    return headers

# ============================================================
# API 封装
# ============================================================

def search_books(keyword: str, page: int = 1) -> dict:
    """
    搜索书籍。

    Args:
        keyword: 搜索关键词
        page: 页码，默认第1页

    Returns:
        dict: 搜索结果 JSON
    """
    params = _sign_params({
        "extend": "",
        "tab": "0",
        "gender": "0",
        "refresh_state": "8",
        "page": str(page),
        "wd": keyword,
        "is_short_story_user": "0",
    })
    headers = _make_headers("00000000")

    resp = requests.get(
        "https://api-bc.wtzw.com/search/v1/words",
        params=params,
        headers=headers,
        proxies=PROXIES,
        timeout=API_TIMEOUT,
    )
    return resp.json()

def get_book_detail(book_id: str) -> dict:
    """
    获取书籍详情（标题、作者、简介、字数、标签、封面等）。

    注意：此接口需要签名参数 + 请求头，否则返回 401。

    Args:
        book_id: 七猫小说 ID（纯数字字符串）

    Returns:
        dict: 书籍详情 JSON，data 字段包含完整信息
    """
    params = _sign_params({"id": book_id})
    headers = _make_headers(book_id)

    resp = requests.get(
        "https://api-bc.wtzw.com/api/v1/reader/detail",
        params=params,
        headers=headers,
        proxies=PROXIES,
        timeout=API_TIMEOUT,
    )
    return resp.json()

def get_book_catalog(book_id: str) -> dict:
    """
    获取书籍目录（章节列表）。

    Args:
        book_id: 七猫小说 ID

    Returns:
        dict: 目录 JSON，data.chapter_lists 为章节数组
    """
    params = _sign_params({
        "chapter_ver": "0",
        "id": book_id,
    })
    headers = _make_headers(book_id)

    resp = requests.get(
        "https://api-ks.wtzw.com/api/v1/chapter/chapter-list",
        params=params,
        headers=headers,
        proxies=PROXIES,
        timeout=API_TIMEOUT,
    )
    return resp.json()

# ============================================================
# 命令行入口
# ============================================================

def _pretty_print(data: dict):
    """JSON 格式化输出（处理 Windows GBK 编码问题）"""
    text = json.dumps(data, ensure_ascii=False, indent=2)
    try:
        print(text)
    except UnicodeEncodeError:
        sys.stdout.reconfigure(encoding="utf-8")
        print(text)

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]
    arg = sys.argv[2]

    if command == "search":
        page = int(sys.argv[3]) if len(sys.argv) > 3 else 1
        result = search_books(arg, page)
        _pretty_print(result)

    elif command == "detail":
        result = get_book_detail(arg)
        _pretty_print(result)

    elif command == "catalog":
        result = get_book_catalog(arg)
        _pretty_print(result)

    else:
        print(f"未知命令: {command}")
        print("可用命令: search, detail, catalog")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

注意留下开头的注释版权信息

## Activity

[![](https://avatars.githubusercontent.com/u/127867059?s=64&u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4)hehetoshang](https://github.com/hehetoshang)

added

[featurenew features todo](https://github.com/talebook/talebook/issues?q=state%3Aopen%20label%3A%22feature%22) new features todo

[on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#event-26708905137)

[![](https://avatars.githubusercontent.com/u/127867059?s=64&u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4)hehetoshang](https://github.com/hehetoshang)

closed this as [completed](https://github.com/talebook/talebook/issues?q=is%3Aissue%20state%3Aclosed%20archived%3Afalse%20reason%3Acompleted) [on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#event-26710264969)

[![](https://avatars.githubusercontent.com/u/127867059?s=64&u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4)hehetoshang](https://github.com/hehetoshang)

reopened this [on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#event-26710467897)

### hehetoshang commented on Jun 13on Jun 13, 2026

[![@hehetoshang](https://avatars.githubusercontent.com/u/127867059?u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4&size=48)](https://github.com/hehetoshang)

[hehetoshang](https://github.com/hehetoshang)

[on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#issuecomment-4698878971)

CollaboratorAuthor

More actions

[@claude](https://github.com/claude) 帮忙实现这个功能

### claude commented on Jun 13on Jun 13, 2026

[![@claude](https://avatars.githubusercontent.com/in/1236702?v=4&size=48)](https://github.com/apps/claude)

[claude](https://github.com/apps/claude) bot

[on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#issuecomment-4698879821) – with [Claude](https://anthropic.com/claude-code)

Last edited by claude

More actions

**Claude finished [@hehetoshang](https://github.com/hehetoshang)'s task in 7m 42s** —— [View job](https://github.com/talebook/talebook/actions/runs/27470273593) • [`claude/issue-805-20260613-1501`](https://github.com/talebook/talebook/tree/claude/issue-805-20260613-1501) • [Create PR ➔](https://github.com/talebook/talebook/compare/master...claude/issue-805-20260613-1501?quick_pull=1&title=feat%3A%20%E6%B7%BB%E5%8A%A0%E4%B8%83%E7%8C%AB%E5%85%8D%E8%B4%B9%E5%B0%8F%E8%AF%B4%E4%B9%A6%E6%BA%90%20%28%23805%29&body=%23%23%20Summary%0A%0A-%20%E6%96%B0%E5%A2%9E%E4%B8%83%E7%8C%AB%E5%85%8D%E8%B4%B9%E5%B0%8F%E8%AF%B4%E5%85%83%E6%95%B0%E6%8D%AE%E4%B9%A6%E6%BA%90%EF%BC%8C%E5%9F%BA%E4%BA%8E%20https%3A%2F%2Fgithub.com%2Fshing-yu%2F7mao-novel-downloader%20%E7%9A%84%E7%AD%BE%E5%90%8D%E9%80%BB%E8%BE%91%0A-%20%E6%94%AF%E6%8C%81%E6%8C%89%E4%B9%A6%E5%90%8D%E6%90%9C%E7%B4%A2%E5%8F%8A%E6%8C%89%20ID%20%E8%8E%B7%E5%8F%96%E4%B9%A6%E7%B1%8D%E8%AF%A6%E6%83%85%0A-%20%E9%99%84%E5%B8%A6%2018%20%E4%B8%AA%E6%B5%8B%E8%AF%95%E7%94%A8%E4%BE%8B%0A%0ACloses%20%23805%0A%0AGenerated%20with%20%5BClaude%20Code%5D(https%3A%2F%2Fclaude.ai%2Fcode))

* * *

### 实现七猫免费小说源

- 分析需求和代码库结构































阅读现有书源实现（番茄小说）以了解模式































创建七猫小说书源 (`webserver/plugins/meta/qimao/api.py`)































在 `__init__.py` 中注册新书源































在 `handlers/book.py` 中集成新书源































编写测试用例 (`tests/test_qimao.py`)































提交并推送代码




















To pick up a draggable item, press the space bar.
While dragging, use the arrow keys to move the item.
Press space again to drop the item in its new position, or press escape to cancel.



* * *

### 实现内容

新增了以下文件和改动：

**新增文件：**

- `webserver/plugins/meta/qimao/__init__.py` — 模块导出
- `webserver/plugins/meta/qimao/api.py` — 七猫小说 API 实现，保留了原始签名注释和版权信息
- `tests/test_qimao.py` — 18 个测试用例，覆盖签名逻辑、搜索、详情获取、封面下载、元数据转换等

**修改文件：**

- `webserver/plugins/meta/__init__.py` — 导出 `QimaoNovelApi`、`KEY`、`QIMAO_ISBN`
- `webserver/handlers/book.py` — 在 `plugin_search_books()` 和 `plugin_get_book_meta()` 中集成七猫书源

**实现特性：**

- 保留了原始签名逻辑（MD5 + SIGN\_KEY，请求头签名，随机 app-version）
- 保留了文件顶部注释引用 `https://github.com/shing-yu/7mao-novel-downloader`
- 搜索时优先精确匹配书名+作者，无精确匹配则返回第一条结果
- `plugin_get_book_meta` 中优先用 `provider_value`（book\_id）获取详情，作为回退再用书名搜索
- 与番茄小说一样，七猫书源不依赖 `META_SELECTED_SOURCES` 配置，自动启用

\|

[![](https://avatars.githubusercontent.com/u/127867059?s=64&u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4)hehetoshang](https://github.com/hehetoshang)

mentioned this [on Jun 13on Jun 13, 2026](https://github.com/talebook/talebook/issues/805#event-7403883775)

- [feat: 添加七猫免费小说书源 (#805) #806](https://github.com/talebook/talebook/pull/806)


[![](https://avatars.githubusercontent.com/u/4410246?s=64&u=6e47f78c01687dc46dcb3d9ed09c5b7da7438b10&v=4)talebook](https://github.com/talebook)

closed this as [completed](https://github.com/talebook/talebook/issues?q=is%3Aissue%20state%3Aclosed%20archived%3Afalse%20reason%3Acompleted) in [#806](https://github.com/talebook/talebook/pull/806) [1mo agoon Jun 17, 2026](https://github.com/talebook/talebook/issues/805#event-26846941185)

[![](https://avatars.githubusercontent.com/u/4410246?s=64&u=6e47f78c01687dc46dcb3d9ed09c5b7da7438b10&v=4)talebook](https://github.com/talebook)

added a commit that references this issue [1mo agoon Jun 17, 2026](https://github.com/talebook/talebook/issues/805#event-26846941348)

[Merge pull request #806 from talebook/claude/issue-805-20260613-1501\
\
feat: 添加七猫免费小说书源 (#805)](https://github.com/talebook/talebook/commit/6f0b15be252eec358c87e9d3e51a117ab4df7089)

[Merge pull request #806 from talebook/claude/issue-805-20260613-1501\
\
feat: 添加七猫免费小说书源 (#805)](https://github.com/talebook/talebook/commit/6f0b15be252eec358c87e9d3e51a117ab4df7089)

[Merge pull request](https://github.com/talebook/talebook/commit/6f0b15be252eec358c87e9d3e51a117ab4df7089) [#806](https://github.com/talebook/talebook/pull/806) from talebook/claude/issue-805-20260613-1501

...

Verified [6f0b15b](https://github.com/talebook/talebook/commit/6f0b15be252eec358c87e9d3e51a117ab4df7089)

[![](https://avatars.githubusercontent.com/in/12910?s=64&v=4)pull](https://github.com/apps/pull)

added a commit that references this issue [1mo agoon Jun 17, 2026](https://github.com/talebook/talebook/issues/805#event-26847012856)

[feat: 添加七猫免费小说书源 (#805)\
\
基于 https://github.com/shing-yu/7mao-novel-downloader 的签名逻辑，\
实现七猫小说元数据获取功能，支持按书名搜索及按 ID 获取书籍详情。\
\
Co-authored-by: houheya <hehetoshang@users.noreply.github.com>](https://github.com/wang1680/talebook/commit/eda0ecf919a8da370e2faaf423f8a41dd0c2428a)

[feat: 添加七猫免费小说书源 (#805)\
\
基于 https://github.com/shing-yu/7mao-novel-downloader 的签名逻辑，\
实现七猫小说元数据获取功能，支持按书名搜索及按 ID 获取书籍详情。\
\
Co-authored-by: houheya <hehetoshang@users.noreply.github.com>](https://github.com/wang1680/talebook/commit/eda0ecf919a8da370e2faaf423f8a41dd0c2428a)

[feat: 添加七猫免费小说书源 (](https://github.com/wang1680/talebook/commit/eda0ecf919a8da370e2faaf423f8a41dd0c2428a) [talebook#805](https://github.com/talebook/talebook/issues/805))

...

[eda0ecf](https://github.com/wang1680/talebook/commit/eda0ecf919a8da370e2faaf423f8a41dd0c2428a)

[Sign up for free](https://github.com/signup?return_to=https://github.com/talebook/talebook/issues/805)**to join this conversation on GitHub.** Already have an account? [Sign in to comment](https://github.com/login?return_to=https://github.com/talebook/talebook/issues/805)

## Metadata

## Metadata

### Assignees

No one assigned

### Labels

[featurenew features todo](https://github.com/talebook/talebook/issues?q=state%3Aopen%20label%3A%22feature%22) new features todo

### Projects

No projects

### Milestone

No milestone

### Relationships

None yet

### Development

- [feat: 添加七猫免费小说书源 (#805)talebook/talebook](https://github.com/talebook/talebook/pull/806) [Releasev26.06.29](https://github.com/talebook/talebook/releases/tag/v26.06.29)

### Participants

[![@hehetoshang](https://avatars.githubusercontent.com/u/127867059?s=64&u=e095f38db6d230c57617af34b5bd15e2577afed0&v=4)](https://github.com/hehetoshang)

## Issue actions

- ![](https://github.githubassets.com/assets/github-copilot-app-light-7138e992c731a2bb.png)Open in GitHub Copilot app

You can’t perform that action at this time.