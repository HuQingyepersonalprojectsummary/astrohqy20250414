---
title: '整理成一份更适合你 Windows 网络配置工具直接参考的 DoH 预设表。'
description: '这里我不是机械地凑 20～30 家，而是优先选了**有官方文档、参数清晰、现在仍可验证的服务**。另外有些服务商提供多个过滤档位，我把这些也单独列出来，因为对你的软件来说，它们实际上应该作为不同预设项存在。'
pubDate: 'September 12 2026'
heroImage: '/blog-placeholder-3.jpg'
---

可以。我给你整理成一份更适合你 **Windows 网络配置工具**直接参考的 DoH 预设表。

这里我不是机械地凑 20～30 家，而是优先选了**有官方文档、参数清晰、现在仍可验证的服务**。另外有些服务商提供多个过滤档位，我把这些也单独列出来，因为对你的软件来说，它们实际上应该作为不同预设项存在。

> **“中国大陆适用性”只是经验性分类，不代表所有运营商、地区都一样。最终还是要实测延迟、丢包和解析正确性。**

| 服务/模式                    | IPv4                                  | IPv6                                    | DoH URL                                              | DoT                                     | 过滤功能                             | 中国大陆 |
| ---------------------------- | ------------------------------------- | --------------------------------------- | ---------------------------------------------------- | --------------------------------------- | ------------------------------------ | -------- |
| **AliDNS 阿里公共 DNS**      | `223.5.5.5` / `223.6.6.6`             | `2400:3200::1` / `2400:3200:baba::1`    | `https://dns.alidns.com/dns-query`                   | `dns.alidns.com`                        | 无默认内容过滤                       | ⭐⭐⭐⭐⭐    |
| **腾讯 Public DNS / DNSPod** | `119.29.29.29`                        | `2402:4e00::` / `2402:4e00:1::`         | `https://doh.pub/dns-query`                          | `dot.pub`                               | 无默认内容过滤                       | ⭐⭐⭐⭐⭐    |
| **360 安全 DNS**             | `101.226.4.6` / `218.30.118.6`        | 官方当前页面未明确列出                  | `https://doh.360.cn/dns-query`                       | 支持 DoT                                | 安全能力                             | ⭐⭐⭐⭐⭐    |
| **Cloudflare Standard**      | `1.1.1.1` / `1.0.0.1`                 | `2606:4700:4700::1111` / `::1001`       | `https://cloudflare-dns.com/dns-query`               | `one.one.one.one`                       | 无过滤                               | ⭐⭐⭐      |
| **Cloudflare Malware**       | `1.1.1.2` / `1.0.0.2`                 | `2606:4700:4700::1112` / `::1002`       | Families DoH                                         | 支持                                    | 恶意域名                             | ⭐⭐⭐      |
| **Cloudflare Family**        | `1.1.1.3` / `1.0.0.3`                 | `2606:4700:4700::1113` / `::1003`       | Families DoH                                         | 支持                                    | 恶意 + 成人                          | ⭐⭐⭐      |
| **Google Public DNS**        | `8.8.8.8` / `8.8.4.4`                 | `2001:4860:4860::8888` / `::8844`       | `https://dns.google/dns-query`                       | `dns.google`                            | 无内容过滤                           | ⭐⭐～⭐⭐⭐  |
| **Quad9 Secure**             | `9.9.9.9` / `149.112.112.112`         | `2620:fe::fe` / `2620:fe::9`            | `https://dns.quad9.net/dns-query`                    | `dns.quad9.net`                         | 恶意域名 + DNSSEC                    | ⭐⭐～⭐⭐⭐  |
| **Quad9 Secure + ECS**       | `9.9.9.11` / `149.112.112.11`         | `2620:fe::11` / `2620:fe::fe:11`        | `https://dns11.quad9.net/dns-query`                  | `dns11.quad9.net`                       | 恶意 + ECS + DNSSEC                  | ⭐⭐⭐      |
| **Quad9 无威胁过滤**         | `9.9.9.10` / `149.112.112.10`         | `2620:fe::10` / `2620:fe::fe:10`        | `https://dns10.quad9.net/dns-query`                  | `dns10.quad9.net`                       | DNSSEC，无恶意过滤                   | ⭐⭐～⭐⭐⭐  |
| **AdGuard Default**          | `94.140.14.14` / `94.140.15.15`       | `2a10:50c0::ad1:ff` / `::ad2:ff`        | `https://dns.adguard-dns.com/dns-query`              | `dns.adguard-dns.com`                   | 广告 + Tracker                       | ⭐⭐⭐      |
| **AdGuard Unfiltered**       | `94.140.14.140` / `94.140.14.141`     | `2a10:50c0::1:ff` / `::2:ff`            | `https://unfiltered.adguard-dns.com/dns-query`       | `unfiltered.adguard-dns.com`            | 无过滤                               | ⭐⭐⭐      |
| **AdGuard Family**           | `94.140.14.15` / `94.140.15.16`       | `2a10:50c0::bad1:ff` / `::bad2:ff`      | `https://family.adguard-dns.com/dns-query`           | `family.adguard-dns.com`                | 广告 + 成人 + SafeSearch             | ⭐⭐⭐      |
| **CleanBrowsing Security**   | `185.228.168.9` / `185.228.169.9`     | `2a0d:2a00:1::2` / `2a0d:2a00:2::2`     | `https://doh.cleanbrowsing.org/doh/security-filter/` | `security-filter-dns.cleanbrowsing.org` | 恶意/钓鱼                            | ⭐⭐       |
| **CleanBrowsing Adult**      | `185.228.168.10` / `185.228.169.11`   | `2a0d:2a00:1::1` / `2a0d:2a00:2::1`     | `https://doh.cleanbrowsing.org/doh/adult-filter/`    | `adult-filter-dns.cleanbrowsing.org`    | 成人 + SafeSearch                    | ⭐⭐       |
| **CleanBrowsing Family**     | `185.228.168.168` / `185.228.169.168` | `2a0d:2a00:1::` / `2a0d:2a00:2::`       | `https://doh.cleanbrowsing.org/doh/family-filter/`   | `family-filter-dns.cleanbrowsing.org`   | 成人 + 恶意 + VPN/Proxy + SafeSearch | ⭐⭐       |
| **Cisco Umbrella / OpenDNS** | `208.67.222.222` / `208.67.220.220`   | `2620:119:35::35` / `2620:119:53::53`   | `https://doh.umbrella.com/dns-query`                 | 支持                                    | 安全 DNS                             | ⭐⭐       |
| **OpenDNS FamilyShield**     | `208.67.222.123` / `208.67.220.123`   | `2620:119:35::123` / `2620:119:53::123` | `https://familyshield.opendns.com/dns-query`         | 支持                                    | 家庭/成人过滤                        | ⭐⭐       |
| **Mullvad Unfiltered**       | `194.242.2.2`                         | `2a07:e340::2`                          | `https://dns.mullvad.net/dns-query`                  | `dns.mullvad.net`                       | 无过滤                               | ⚠️        |
| **Mullvad Base**             | `194.242.2.4`                         | `2a07:e340::4`                          | `https://base.dns.mullvad.net/dns-query`             | `base.dns.mullvad.net`                  | 广告 + Tracker + Malware             | ⚠️        |
| **Mullvad Family**           | `194.242.2.6`                         | `2a07:e340::6`                          | `https://family.dns.mullvad.net/dns-query`           | `family.dns.mullvad.net`                | 广告 + 恶意 + 成人 + 赌博            | ⚠️        |

阿里公共 DNS 官方目前明确公布 IPv4、IPv6 和 `dns.alidns.com`，阿里云 DoH 文档中的 RFC 8484 示例也明确使用 `https://dns.alidns.com/dns-query`。 ([阿里DNS](https://alidns.com/?lailu=www.gongwule.com%2F&utm_source=chatgpt.com))

腾讯公共解析目前官方给出的免费 Public DNS 参数是 `119.29.29.29`、IPv6 `2402:4e00:: / 2402:4e00:1::`、DoH `https://doh.pub/dns-query`、DoT `dot.pub`。官方同时说明免费版单域名请求频率限制为 **20 QPS**，且不承诺 SLA；这点如果你要把它内置进软件，最好在说明里保留。([腾讯云](https://cloud.tencent.com/document/product/302/110784?utm_source=chatgpt.com))

360 安全 DNS 官方现在明确支持 IPv4/IPv6、DoH/DoT；公开 DoH RFC 8484 地址是 `https://doh.360.cn/dns-query`。普通 DNS 当前页面列出的主要 IPv4 是 `101.226.4.6` 和 `218.30.118.6`。([sdns.360.net](https://sdns.360.net/?utm_source=chatgpt.com))

Cloudflare 标准解析器以及 `1.1.1.2`、`1.1.1.3` 家庭过滤地址仍然有效；标准 DoH 使用 HTTPS 443，DoT 使用 853。([Cloudflare Docs](https://developers.cloudflare.com/1.1.1.1/ip-addresses/?utm_source=chatgpt.com))

Google Public DNS 的标准地址仍是 `8.8.8.8 / 8.8.4.4`，DoH 推荐 RFC 8484 Endpoint 为 `https://dns.google/dns-query`，同时支持 DoT。Google 官方明确表示它**不是以恶意域名/广告过滤为主要用途的过滤 DNS**。([Google for Developers](https://developers.google.com/speed/public-dns/docs/using?authuser=31&utm_source=chatgpt.com))

Quad9 在 2026 年有一个值得注意的变化：**从 2026 年 6 月 15 日开始所有服务 Endpoint 都启用 DNSSEC 验证**，所以过去一些旧资料写 `9.9.9.10` “不做 DNSSEC”的说法现在已经过时。它仍然可以选择是否启用 Threat Blocking、ECS。([Quad9 文档](https://docs.quad9.net/services/?utm_source=chatgpt.com))

AdGuard 三套公共解析——默认过滤、无过滤、Family——目前官方都同时给出了 IPv4、IPv6、DoH 和 DoT。([AdGuard DNS — ad-blocking DNS server](https://adguard-dns.io/en/public-dns.html?utm_source=chatgpt.com))

CleanBrowsing 同样比较适合作为你的软件预设，因为它把 **Security / Adult / Family** 三档的 IPv4、IPv6、DoH、DoT 都公开得非常完整。([CleanBrowsing](https://cleanbrowsing.org/filters?utm_source=chatgpt.com))

Cisco Umbrella/OpenDNS 当前支持核心 resolver 的 DoH，标准 Endpoint 为 `https://doh.umbrella.com/dns-query`，FamilyShield 也有独立的 DoH 地址。([Cisco](https://www.cisco.com/c/en/us/support/docs/security/umbrella/224705-configure-dns-over-https-doh-with.html?utm_source=chatgpt.com))

### ⚠️ Mullvad 现在不要长期内置

这个尤其值得你注意。

Mullvad 在 **2026 年 9 月 3 日**更新了官方说明：

> 其公共加密 DNS 服务将在 **2026 年 11 月 2 日停止**。

现在是 2026 年 9 月，所以虽然它目前仍然可用，但**不适合再作为你软件的长期默认预设**。如果内置，建议直接标记：

```text
Deprecated / 将于 2026-11-02 停止服务
```

或者干脆不要加入正式版本。([Mullvad VPN](https://mullvad.net/de/help/dns-over-https-and-dns-over-tls?utm_source=chatgpt.com))

## 对你的 Windows 网络工具，我建议预设这样分组

不要简单放一个很长的 DNS 下拉框，可以分成：

```text
中国大陆
├─ AliDNS
├─ 腾讯 Public DNS
└─ 360 安全 DNS

全球通用
├─ Cloudflare
├─ Google
├─ Quad9
└─ Cisco Umbrella

广告/追踪过滤
├─ AdGuard DNS
└─ Mullvad Base（即将停止，不建议）

安全过滤
├─ Cloudflare Malware
├─ Quad9 Secure
├─ CleanBrowsing Security
└─ Cisco Umbrella

家庭过滤
├─ Cloudflare Family
├─ AdGuard Family
├─ CleanBrowsing Family
└─ OpenDNS FamilyShield

无过滤
├─ AliDNS
├─ Tencent Public DNS
├─ Cloudflare
├─ Google
├─ Quad9 No Threat Blocking
└─ AdGuard Unfiltered
```

这样比单纯列 20 个服务好用很多。

### 我比较推荐你默认内置的 10 个

如果不想把程序做得太杂，我会优先保留：

1. **AliDNS**
2. **腾讯 Public DNS**
3. **360 安全 DNS**
4. **Cloudflare**
5. **Cloudflare Malware**
6. **Google Public DNS**
7. **Quad9 Secure**
8. **AdGuard DNS**
9. **AdGuard Family**
10. **CleanBrowsing Security**

其中在中国大陆，我建议 UI 不要直接写“最快”，而写：

> **国内网络推荐候选**

因为 DNS 实际速度与运营商、地区、IPv4/IPv6 路由、晚高峰状态都有关系，不能仅凭服务商所在地判定。

如果是为你这个 **Windows Network Config Tool** 做下一版，我甚至建议加入一个：

```text
测速并推荐 DNS
```

自动对这些预设执行：

```text
DoH TLS 建连时间
DNS 查询 RTT
连续 10 次成功率
IPv4 / IPv6 可达性
DNSSEC 测试
```

最后显示：

```text
AliDNS            18 ms   100%   推荐
Tencent Public    23 ms   100%   推荐
360 DNS           31 ms   100%
Cloudflare        78 ms   100%
Quad9             146 ms   90%
Google            192 ms   100%
```

这个功能会比“固定推荐某个 DNS”实用很多。
