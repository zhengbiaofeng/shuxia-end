[Skip to content](https://github.com/shing-yu/swiftcat-downloader#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/shing-yu/swiftcat-downloader) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/shing-yu/swiftcat-downloader) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/shing-yu/swiftcat-downloader) to refresh your session.Dismiss alert

{{ message }}

This repository was archived by the owner on May 11, 2026. It is now read-only.


[shing-yu](https://github.com/shing-yu)/ **[swiftcat-downloader](https://github.com/shing-yu/swiftcat-downloader)** Public archive

- [Notifications](https://github.com/login?return_to=%2Fshing-yu%2Fswiftcat-downloader) You must be signed in to change notification settings
- [Fork\\
2](https://github.com/login?return_to=%2Fshing-yu%2Fswiftcat-downloader)
- [Star\\
43](https://github.com/login?return_to=%2Fshing-yu%2Fswiftcat-downloader)


main

[**1** Branch](https://github.com/shing-yu/swiftcat-downloader/branches) [**1** Tag](https://github.com/shing-yu/swiftcat-downloader/tags)

[Go to Branches page](https://github.com/shing-yu/swiftcat-downloader/branches)[Go to Tags page](https://github.com/shing-yu/swiftcat-downloader/tags)

Go to file

Code

Open more actions menu

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| ## Latest commit<br>[![shing-yu](https://avatars.githubusercontent.com/u/109603760?v=4&size=40)](https://github.com/shing-yu)[shing-yu](https://github.com/shing-yu/swiftcat-downloader/commits?author=shing-yu)<br>[Update README.md](https://github.com/shing-yu/swiftcat-downloader/commit/9227dacf7ae741aab04d76e111f9e34b89cf28d4)<br>2 months agoMay 11, 2026<br>[9227dac](https://github.com/shing-yu/swiftcat-downloader/commit/9227dacf7ae741aab04d76e111f9e34b89cf28d4) · 2 months agoMay 11, 2026<br>## History<br>[6 Commits](https://github.com/shing-yu/swiftcat-downloader/commits/main/) <br>Open commit details<br>[View commit history for this file.](https://github.com/shing-yu/swiftcat-downloader/commits/main/) 6 Commits |
| [README.md](https://github.com/shing-yu/swiftcat-downloader/blob/main/README.md "README.md") | [README.md](https://github.com/shing-yu/swiftcat-downloader/blob/main/README.md "README.md") | [Update README.md](https://github.com/shing-yu/swiftcat-downloader/commit/9227dacf7ae741aab04d76e111f9e34b89cf28d4 "Update README.md") | 2 months agoMay 11, 2026 |
| View all files |

## Repository files navigation

# 灵猫小说下载器

[Permalink: 灵猫小说下载器](https://github.com/shing-yu/swiftcat-downloader#%E7%81%B5%E7%8C%AB%E5%B0%8F%E8%AF%B4%E4%B8%8B%E8%BD%BD%E5%99%A8)

一个用于下载七猫小说的工具。

[Flutter 版本](https://github.com/shing-yu/swiftcat-downloader-flutter)

python 版本已存档，建议使用上方 Flutter 版本

## 特性

[Permalink: 特性](https://github.com/shing-yu/swiftcat-downloader#%E7%89%B9%E6%80%A7)

- [x]  支持保存为TXT格式
- [x]  支持保存为单文件或按章节保存
- [x]  极快的下载速度
- [x]  用户友好的界面
- [ ]  全平台支持\*
- [x]  下载为EPUB格式
- [x]  通过书名搜索小说

\*Python版本仅支持 Windows、Linux 和 macOS，如果您需要在其他（如 Android、iOS）平台上使用，请使用 Flutter 版本。

## 特定于平台的说明

[Permalink: 特定于平台的说明](https://github.com/shing-yu/swiftcat-downloader#%E7%89%B9%E5%AE%9A%E4%BA%8E%E5%B9%B3%E5%8F%B0%E7%9A%84%E8%AF%B4%E6%98%8E)

#### macOS

[Permalink: macOS](https://github.com/shing-yu/swiftcat-downloader#macos)

macOS推荐使用上方的Flutter版本，此Python版本可能存在兼容性问题。

您可能需要执行以下操作来在新版本的 macOS 上运行应用：

1. 打开“终端”应用
2. 输入并回车执行 `sudo spctl --global-disable`，


输入您的管理员密码（输入时不会显示）并回车；
3. 打开 系统设置 > 隐私与安全性 \> 常规，


在“允许以下来源的应用程序”下选择“任何来源”，输入密码并同意。
4. 在“终端”应用中输入并回车执行 `sudo xattr -r -d com.apple.quarantine /Applications/灵猫小说下载器py.app`
5. 运行应用。


支持的架构：arm64 (Apple Silicon)、x86\_64 (Intel)

## 许可

[Permalink: 许可](https://github.com/shing-yu/swiftcat-downloader#%E8%AE%B8%E5%8F%AF)

Copyright (c) 2025 StarEdge Studio. All rights reserved.

Python版本不开源，此仓库仅用于发布二进制文件。

所有者授予您一份非独占、不可转让的许可，允许您在遵守以下条款的前提下使用本软件：

- 您可以在个人设备上安装和使用本软件。
- 您可以将本软件用于个人学习和研究目的。
- 严禁将本软件用于任何商业目的，包括但不限于销售、分发或以任何形式（如帮助他人下载小说）并从中获利。
- 您不得修改、反编译、反汇编或以其他方式试图获取本软件的源代码。
- 您不得将本软件用于任何非法活动，包括但不限于侵犯他人知识产权、传播恶意软件或进行网络攻击。
- 您不得将本软件用于任何违反当地法律法规的活动。
- 您不得将本软件用于任何可能损害本软件所有者或第三方权益的活动。

书籍内容著作权归原作者所有，使用本软件下载书籍内容前请确保您遵循当地法律法规。

本项目作者、贡献者不对因用户使用本软件而导致的任何直接、间接、偶然、特殊或后果性损害承担责任。

## 技术支持

[Permalink: 技术支持](https://github.com/shing-yu/swiftcat-downloader#%E6%8A%80%E6%9C%AF%E6%94%AF%E6%8C%81)

社区Q群：690736066

如果您认为本程序侵犯了您的权益，请通过 [shyu@staredges.cn](mailto:shyu@staredges.cn) 联系我们。

## About

全新一代GUI七猫小说下载器


### Resources

[Readme](https://github.com/shing-yu/swiftcat-downloader#readme-ov-file)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/shing-yu/swiftcat-downloader).

[Activity](https://github.com/shing-yu/swiftcat-downloader/activity)

### Stars

**43**
stars


### Watchers

**0**
watching


### Forks

[**2**\\
forks](https://github.com/shing-yu/swiftcat-downloader/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2Fshing-yu%2Fswiftcat-downloader&report=shing-yu+%28user%29)

## [Releases\  1](https://github.com/shing-yu/swiftcat-downloader/releases)

[v1.0.0\\
Latest\\
\\
on Jul 23, 2025Jul 23, 2025](https://github.com/shing-yu/swiftcat-downloader/releases/tag/v1.0.0)

## [Packages\  0](https://github.com/users/shing-yu/packages?repo_name=swiftcat-downloader)

No packages published

## [Contributors\  1](https://github.com/shing-yu/swiftcat-downloader/graphs/contributors)

- [![@shing-yu](https://avatars.githubusercontent.com/u/109603760?s=64&v=4)](https://github.com/shing-yu)[**shing-yu** Hoshi Sumi](https://github.com/shing-yu)

You can’t perform that action at this time.