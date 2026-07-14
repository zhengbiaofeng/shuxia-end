[Skip to content](https://github.com/shing-yu/7mao-novel-downloader/blob/main/src/SLQimao/book.py#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/shing-yu/7mao-novel-downloader/blob/main/src/SLQimao/book.py) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/shing-yu/7mao-novel-downloader/blob/main/src/SLQimao/book.py) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/shing-yu/7mao-novel-downloader/blob/main/src/SLQimao/book.py) to refresh your session.Dismiss alert

{{ message }}

This repository was archived by the owner on Dec 3, 2025. It is now read-only.


[shing-yu](https://github.com/shing-yu)/ **[7mao-novel-downloader](https://github.com/shing-yu/7mao-novel-downloader)** Public archive

- [Notifications](https://github.com/login?return_to=%2Fshing-yu%2F7mao-novel-downloader) You must be signed in to change notification settings
- [Fork\\
60](https://github.com/login?return_to=%2Fshing-yu%2F7mao-novel-downloader)
- [Star\\
403](https://github.com/login?return_to=%2Fshing-yu%2F7mao-novel-downloader)


## Collapse file tree

## Files

main

Search this repository(forward slash)` forward slash/`

/

# book.py

Copy path

Blame

More file actions

Blame

More file actions

## Latest commit

[![shing-yu](https://avatars.githubusercontent.com/u/109603760?v=4&size=40)](https://github.com/shing-yu)[shing-yu](https://github.com/shing-yu/7mao-novel-downloader/commits?author=shing-yu)

[fix:](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [fixed](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [#16](https://github.com/shing-yu/7mao-novel-downloader/issues/16) [;](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [fixed](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [#17](https://github.com/shing-yu/7mao-novel-downloader/issues/17) [;](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [fixed](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) [#19](https://github.com/shing-yu/7mao-novel-downloader/issues/19) [.](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500)

2 years agoJun 29, 2024

[9198624](https://github.com/shing-yu/7mao-novel-downloader/commit/9198624284f1b41fe434e8793ed788e7daae3500) · 2 years agoJun 29, 2024

## History

[History](https://github.com/shing-yu/7mao-novel-downloader/commits/main/src/SLQimao/book.py)

Open commit details

[View commit history for this file.](https://github.com/shing-yu/7mao-novel-downloader/commits/main/src/SLQimao/book.py) History

557 lines (498 loc) · 19.8 KB

/

# book.py

Copy path

Top

## File metadata and controls

- Code

- Blame


557 lines (498 loc) · 19.8 KB

[Raw](https://github.com/shing-yu/7mao-novel-downloader/raw/refs/heads/main/src/SLQimao/book.py)

Copy raw file

Download raw file

You must be signed in to make or propose changes

More edit options

Open symbols panel

Edit and raw actions

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

34

35

36

37

38

39

40

41

42

43

44

45

46

47

48

49

50

51

52

53

54

55

56

57

58

59

60

61

62

63

64

65

66

67

68

69

70

71

72

73

74

75

76

77

78

79

80

81

82

83

84

85

86

87

88

89

90

91

92

93

94

95

96

97

98

99

100

101

102

103

104

105

106

107

108

109

110

111

112

113

114

115

116

117

118

119

120

121

122

123

124

125

126

127

128

129

130

131

132

133

134

135

136

137

138

139

140

141

142

143

144

145

146

147

148

149

150

484

485

486

487

488

489

490

491

492

493

494

495

496

497

498

499

500

501

502

503

504

505

506

507

508

509

510

511

512

513

514

515

516

517

518

519

520

521

522

523

524

525

526

527

528

529

530

531

532

533

534

535

536

537

538

539

540

541

542

543

544

545

546

547

548

549

550

551

552

553

554

555

556

557

from . importnullproxies, version\_list, key, red, yellow, green, clear\_screen

importhashlib

importrandom

importrequests

importre

frombase64importb64decode

fromCrypto.CipherimportAES\# noqa

fromCrypto.Util.Paddingimportunpad\# noqa

\# import tqdm

fromrich.progressimport (

Progress,

BarColumn,

TimeElapsedColumn,

TimeRemainingColumn,

SpinnerColumn,

TaskProgressColumn,

DownloadColumn

)

importtime

importzipfile

importos

importshutil

importdatetime

\# epub mode

fromebooklibimportepub

classBook:

"""

七猫小说类\\n

事实上，这不是一个仅限于类名意义的书籍类\\n

而是应该被视为一个对于某本七猫小说的程序操作实例\\n

注意：下载过程中使用了tqdm显示进度条，如果不需要显示进度条，请自行修改\\n

:param book\_id: 小说ID

:param proxies: 代理，默认无代理

"""

def\_\_init\_\_(self, book\_id: str, proxies: dict=nullproxies) ->None:

"""

使用小说ID初始化Book对象

:param book\_id:

"""

self.book\_id: str=book\_id\# 小说ID

self.proxies: dict=proxies\# 代理

self.version\_list: list=version\_list\# app版本列表

self.key: str=key\# 签名key

self.headers: dict=self.\_get\_headers() \# 请求头

self.title: str="None"\# 小说标题

self.author: str="None"\# 作者

self.intro: str="None"\# 简介

self.words\_num: int=0\# 字数

self.tags: str="None"\# 标签

self.basecontent: str="None"\# 基础内容（仅txt模式）

self.img\_url: str="None"\# 封面图片链接（仅epub模式）

self.catalog: list= \[\] \# 目录

self.lastcid: str="None"\# 最后一个章节ID

self.file\_path: str="None"\# 保存后文件路径

self.encoding: str="utf-8"\# 文件编码（仅txt模式）

def\_get\_headers(self) ->dict:

"""

根据小说ID生成请求头

:return: 请求头

"""

\# 使用小说ID作为随机种子

random.seed(self.book\_id)

\# 随机选择一个版本

version=random.choice(self.version\_list)

headers= {

"AUTHORIZATION": "",

"app-version": f"{version}",

"application-id": "com.\*\*\*\*.reader",

"channel": "unknown",

"net-env": "1",

"platform": "android",

"qm-params": "",

"reg": "0",

}

\# 获取 headers 的所有键并排序

keys=sorted(headers.keys())

\# 生成待签名的字符串

sign\_str=''.join(\[k+'='+str(headers\[k\]) forkinkeys\]) +self.key

\# 生成签名

headers\['sign'\] =hashlib.md5(sign\_str.encode()).hexdigest()

returnheaders

def\_sign(self, params: dict) ->dict:

"""

原名: sign\_url\_params\\n

签名url参数

:param params: url参数

:return: 签名后的url参数

"""

keys=sorted(params.keys())

\# 生成待签名的字符串

sign\_str=''.join(\[k+'='+str(params\[k\]) forkinkeys\]) +self.key

\# 使用MD5哈希生成签名

signature=hashlib.md5(sign\_str.encode()).hexdigest()

\# 将签名添加到参数字典中

params\['sign'\] =signature

returnparams

@staticmethod

def\_rename(name: str) ->str:

"""

替换将要作为文件名的小说/章节名中的非法字符

:param name: 原名

:return: 替换后的名字

"""

\# 定义非法字符的正则表达式模式

illegal\_characters\_pattern=r'\[\\/:\*?"<>\|\]'

\# 定义替换的中文符号

replacement\_dict= {

'/': '／',

':': '：',

'\*': '＊',

'?': '？',

'"': '“',

'<': '＜',

'>': '＞',

'\|': '｜'

}

\# 使用正则表达式替换非法字符

new\_name=re.sub(illegal\_characters\_pattern, lambdax: replacement\_dict\[x.group(0)\], name)

returnnew\_name

@staticmethod

def\_decrypt(origin: str) ->str:

"""

解密被加密的文本

:param origin: 被加密的文本

:return: 解密后的文本

"""

\# 七猫使用AES加密

txt=b64decode(origin)

iv=txt\[:16\].hex()

data=txt\[16:\].hex()

dkey=bytes.fromhex('32343263636238323330643730396531')

iv=bytes.fromhex(iv)

"app-version": f"{version}",

"application-id": "com.\*\*\*\*.reader",

"channel": "unknown",

"net-env": "1",

"platform": "android",

"qm-params": "",

"reg": "0",

}

\# 获取 headers 的所有键并排序

keys=sorted(headers.keys())

\# 生成待签名的字符串

sign\_str=''.join(\[k+'='+str(headers\[k\]) forkinkeys\]) +key

\# 生成签名

headers\['sign'\] =hashlib.md5(sign\_str.encode()).hexdigest()

returnheaders

defsearch() ->str\|None:

"""

搜索小说\\n

注意：此函数为交互式函数，不应在非交互式环境中使用\\n

:return: 用户选择的小说ID，或者None

"""

try:

whileTrue:

key\_=input("请输入搜索关键词（按下Ctrl+C返回）：")

\# 获取搜索结果列表

params\_= {

'extend': '',

'tab': '0',

'gender': '0',

'refresh\_state': '8',

'page': '1',

'wd': f'{key\_}',

'is\_short\_story\_user': '0'

}

response=requests.get("https://api-bc.wtzw.com/search/v1/words", params=sign\_url(params\_),

headers=get\_headers("00000000"), timeout=10).json()

books=response\['data'\]\['books'\]

fori, bookinenumerate(books):

try:

\# 如果没有字数信息则显示未知

if"words\_num"notinbook:

book\["words\_num"\] ="未知"

print(f"{i+1}. 名称：{book\['original\_title'\]} 作者：{book\['original\_author'\]} "

f"ID：{book\['id'\]} 字数：{book\['words\_num'\]}")

exceptKeyError:

break

whileTrue:

choice\_=input("请选择一个结果, 输入r以重新搜索：")

ifchoice\_=="r":

clear\_screen()

break

elifchoice\_.isdigit():

choice=int(choice\_)

ifchoice>len(books):

print("输入无效，请重新输入。")

continue

chosen\_book=books\[choice-1\]

book\_id=chosen\_book\['id'\]

returnbook\_id

else:

print("输入无效，请重新输入。")

continue

exceptKeyboardInterrupt:

return

You can’t perform that action at this time.