#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enrich Tennis Player Data with:
- Profile Photo (imageUrl)
- SNS Accounts (Instagram, X / Twitter)
- Background / Personality Stories with Summary and Article Links
- Play Videos (YouTube, TikTok highlights)
"""

import json
import os

def enrich_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")

    # 主要選手の詳細データマップ (id -> 追加情報)
    enrich_map = {
        "jannik-sinner": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Jannik_Sinner_2023.jpg/480px-Jannik_Sinner_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/janniksin/",
                "twitter": "https://x.com/janniksin"
            },
            "stories": [
                {
                    "title": "スキーのジュニア王者からテニス世界1位へ：シナーの謙虚な原点",
                    "source": "Number Web",
                    "url": "https://number.bunshun.jp/articles/-/860451",
                    "summary": "北イタリア・南チロルの山岳地帯に生まれ、幼少期はアルペンスキーの大回転で全国チャンピオンだった。13歳で名伯楽リカルド・ピアッティのアカデミーに入るため親元を離れ自活。両親は山小屋のコックとウェイトレスで、質素で勤勉な家庭環境から『勝っても奢らず、負けても学び続ける』謙虚な人柄が培われた。"
                },
                {
                    "title": "感情を露わにしない氷のメンタルと、家族への感謝",
                    "source": "ATP Tour 公式",
                    "url": "https://www.atptour.com/en/news/sinner-australian-open-2024-final-reaction",
                    "summary": "全豪オープン初制覇時のスピーチで『両親が自分に決してプレッシャーをかけず、好きなスポーツを自由に選ばせてくれたことに感謝したい』と語り世界中の感動を呼んだ。"
                }
            ],
            "videos": [
                {
                    "title": "ヤニック・シナー 驚異のフォアハンド＆ベストショット集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Jannik+Sinner+best+shots+highlights"
                },
                {
                    "title": "シナーの信じられない超高速ラリー＆スライドショット",
                    "platform": "TikTok",
                    "url": "https://www.tiktok.com/tag/janniksinner"
                }
            ]
        },
        "carlos-alcaraz": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Carlos_Alcaraz_%28ESP%29_2023.jpg/480px-Carlos_Alcaraz_%28ESP%29_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/carlosalcarazz/",
                "twitter": "https://x.com/carlosalcaraz"
            },
            "stories": [
                {
                    "title": "祖父が教えた『頭・心・勇気』の教え：ナダルの後継者の素顔",
                    "source": "THE TENNIS DAILY",
                    "url": "https://www.thetennisdaily.jp/news/overseas/primary/2022/0047814.php",
                    "summary": "スペイン・ムルシア出身。祖父から贈られた『頭（Cabeza）、心（Corazon）、勇気（Cojones）の3つのCを持て』という言葉を常に胸に刻んでプレーする。元世界1位のフアン・カルロス・フェレーロと固い絆で結ばれ、ツアー屈指の天真爛漫な笑顔と家族想いの性格で誰からも愛される。"
                }
            ],
            "videos": [
                {
                    "title": "カルロス・アルカラス 神業ドロップショット＆超人的コートカバー集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Carlos+Alcaraz+impossible+shots+highlights"
                },
                {
                    "title": "アルカラスの圧巻スーパープレー＆笑顔ハイライト",
                    "platform": "TikTok",
                    "url": "https://www.tiktok.com/tag/carlosalcaraz"
                }
            ]
        },
        "novak-djokovic": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Novak_Djokovic_Queen%27s_Club_2018.jpg/480px-Novak_Djokovic_Queen%27s_Club_2018.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/djokernole/",
                "twitter": "https://x.com/DjokerNole"
            },
            "stories": [
                {
                    "title": "ベオグラードの空爆を潜り抜けた少年：逆境が鍛えた鉄の心",
                    "source": "BBC Sport / Number",
                    "url": "https://number.bunshun.jp/articles/-/848834",
                    "summary": "1999年のコソボ紛争時、夜間は地下シェルターで過ごし、昼間は爆撃の跡が残る空き地でテニスの練習を続けた。いかなる過酷な状況でも動じない超人的なメンタリティと、グルテンフリー・菜食を取り入れた徹底的な肉体管理のルーツはここにある。"
                }
            ],
            "videos": [
                {
                    "title": "ノバク・ジョコビッチ 史上最高のスーパープレー＆マッチポイント集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Novak+Djokovic+best+moments+career"
                }
            ]
        },
        "kei-nishikori": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kei_Nishikori_%28JPN%29_2019.jpg/480px-Kei_Nishikori_%28JPN%29_2019.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/keinishikori/",
                "twitter": "https://x.com/keinishikori"
            },
            "stories": [
                {
                    "title": "13歳で海を渡った島根の少年：盛田ファンドと不屈の闘志",
                    "source": "スポルティーバ",
                    "url": "https://sportiva.shueisha.co.jp/clm/otherballgame/tennis/",
                    "summary": "島根県松江市出身。盛田正明氏の奨学金制度により、英語も話せないまま13歳で単身米フロリダのIMGアカデミーへ留学。体格の劣勢を卓越したフットワークとイマジネーションで補い、アジア男子初の世界ランク4位・GS準優勝を果たす。大手術を幾度も経てもなおテニスへの情熱を失わないレジェンド。"
                }
            ],
            "videos": [
                {
                    "title": "錦織圭 伝説の『エア・ケイ』＆神業バックハンド集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Kei+Nishikori+best+shots+air+kei"
                },
                {
                    "title": "錦織圭の華麗なタッチ＆ドロップショット集",
                    "platform": "TikTok",
                    "url": "https://www.tiktok.com/tag/keinishikori"
                }
            ]
        },
        "yoshihito-nishioka": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Yoshihito_Nishioka_2023.jpg/480px-Yoshihito_Nishioka_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/yoshihito0927/",
                "twitter": "https://x.com/yoshihitotennis",
                "youtube": "https://www.youtube.com/@yoshihitonishioka"
            },
            "stories": [
                {
                    "title": "身長170cmで世界の巨漢を討つ：YouTuberとしても人気の日本エース",
                    "source": "テレ朝POST",
                    "url": "https://post.tv-asahi.co.jp/post-205120/",
                    "summary": "三重県津市出身。現代男子テニス界で最も小柄な部類に入りながら、並外れた読みと左利きの変化球、相手の心理を突く戦略で世界20位台へ登り詰めた。自身の公式YouTubeチャンネルでもツアーの裏側やテニスの魅力を精力的に発信しファンに愛される。"
                }
            ],
            "videos": [
                {
                    "title": "西岡良仁 驚異のカウンターショット＆ツアー優勝ハイライト",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Yoshihito+Nishioka+highlights"
                }
            ]
        },
        "rei-sakamoto": {
            "imageUrl": "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&auto=format&fit=crop&q=80",
            "sns": {
                "instagram": "https://www.instagram.com/rei_sakamoto_0826/"
            },
            "stories": [
                {
                    "title": "195cmの大型新星：全豪ジュニア制覇で見せた侍ポーズ",
                    "source": "日刊スポーツ",
                    "url": "https://www.nikkansports.com/sports/news/202401270000845.html",
                    "summary": "愛知県出身。日本人男子として史上初めて全豪オープン・ジュニアシングルスを制覇。勝利後にラケットを日本刀に見立てて鞘に収める『侍ポーズ』で海外メディアの話題をさらった。世界ジュニア1位を経てプロの世界へ。"
                }
            ],
            "videos": [
                {
                    "title": "坂本怜 全豪オープン・ジュニア歴史的優勝ハイライト",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Rei+Sakamoto+Australian+Open+Junior+Final"
                }
            ]
        },
        "tokito-oda": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tokito_Oda_2023.jpg/480px-Tokito_Oda_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/tokitooda_official/",
                "twitter": "https://x.com/tokitooda"
            },
            "stories": [
                {
                    "title": "9歳での骨肉腫を乗り越えて：国枝慎吾の背中を追った少年",
                    "source": "パラサポWEB",
                    "url": "https://www.parasapo.tokyo/topics/106308",
                    "summary": "愛知県一宮市出身。サッカー少年だった9歳の時に左脚の骨肉腫を発症し人工関節を入れる。病室で見たロンドンパラリンピックの国枝慎吾氏の金メダルに心を打たれ車いすテニスを開始。『病気になったからこそ世界一になれた』と語り、17歳で世界1位、18歳でパリパラリンピック金メダルを獲得した若きスーパースター。"
                },
                {
                    "title": "車いすテニスを最高にクールなスポーツへ",
                    "source": "GQ JAPAN",
                    "url": "https://www.gqjapan.jp/article/20240908-tokito-oda",
                    "summary": "ファッションや髪型、発言の一つひとつにこだわりを持ち、『車いすテニスを誰もが憧れるカッコいいスポーツにする』という強烈なプロ意識を持つ。"
                }
            ],
            "videos": [
                {
                    "title": "小田凱人 パリパラリンピック金メダル獲得の瞬間＆超絶スーパーショット",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Tokito+Oda+Paris+Paralympics+Final"
                },
                {
                    "title": "小田凱人の世界最速チェアワーク＆左腕スピン",
                    "platform": "TikTok",
                    "url": "https://www.tiktok.com/tag/tokitooda"
                }
            ]
        },
        "yui-kamiji": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Yui_Kamiji_2016.jpg/480px-Yui_Kamiji_2016.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/kamijiyui.official/",
                "twitter": "https://x.com/yui_kamiji"
            },
            "stories": [
                {
                    "title": "悲願の金メダル：10代から世界の頂点を争い続けた努力の人",
                    "source": "NHK スポーツ",
                    "url": "https://www3.nhk.or.jp/sports/special/paralympic/athletes/kamiji-yui/",
                    "summary": "兵庫県明石市出身。先天性の潜在性二分脊椎症。11歳で車いすテニスと出会い、巧みなチェアワークとトップスピンロブを武器に世界ランク1位へ。絶対女王ディーデ・デフロートという巨大な壁と幾度も名勝負を繰り広げ、2024年パリパラリンピックで単複2冠の悲願を成し遂げた。"
                }
            ],
            "videos": [
                {
                    "title": "上地結衣 パリパラリンピック単複2冠の軌跡＆芸術的ロブ",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Yui+Kamiji+Paris+Paralympic+Gold"
                }
            ]
        },
        "naomi-osaka": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Naomi_Osaka_%28JPN%29_2024.jpg/480px-Naomi_Osaka_%28JPN%29_2024.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/naomiosaka/",
                "twitter": "https://x.com/naomiosaka"
            },
            "stories": [
                {
                    "title": "母となり戻ってきたテニスコート：世界女王の新たな章",
                    "source": "Vogue Japan",
                    "url": "https://www.vogue.co.jp/celebrity/article/naomi-osaka-return-to-tennis",
                    "summary": "大阪市生まれ、3歳で渡米。アジア人初の世界ランク1位、グランドスラム通算4勝を達成。人種差別抗議やアスリートのメンタルヘルス啓発など社会的メッセージを発信し続けてきた。長女シャイちゃんを出産後、2024年に復帰しさらなる高みを目指す。"
                }
            ],
            "videos": [
                {
                    "title": "大坂なおみ 時速200km超の弾丸サーブ＆ベストウィナー集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Naomi+Osaka+best+shots+highlights"
                }
            ]
        },
        "aryna-sabalenka": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Aryna_Sabalenka_2023.jpg/480px-Aryna_Sabalenka_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/arynasabalenka/",
                "twitter": "https://x.com/SabalenkaA"
            },
            "stories": [
                {
                    "title": "亡き父に捧げる世界1位：トラのタトゥーに込めた誇り",
                    "source": "WTA公式",
                    "url": "https://www.wtatennis.com/news/3866299/sabalenka-honors-late-father",
                    "summary": "元アイスホッケー選手だった最愛の父セルゲイ氏を43歳の若さで亡くす悲劇を乗り越え、『父との約束だった世界1位になる』という誓いを果たす。左腕には自身の闘志を象徴するトラのタトゥーが刻まれている。愛嬌たっぷりでツアー仲間からも慕われる人気者。"
                }
            ],
            "videos": [
                {
                    "title": "アリーナ・サバレンカ 女子最速級の豪腕ショット＆GS優勝ハイライト",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Aryna+Sabalenka+power+shots+highlights"
                }
            ]
        },
        "iga-swiatek": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Iga_Swiatek_2023.jpg/480px-Iga_Swiatek_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/iga.swiatek/",
                "twitter": "https://x.com/iga_swiatek"
            },
            "stories": [
                {
                    "title": "読書家でロック好き：コート上の支配者が持つピュアな心",
                    "source": "Tennis.com",
                    "url": "https://www.tennis.com/news/articles/iga-swiatek-reading-challenge",
                    "summary": "父はボート競技の五輪選手。趣味は読書で、自身のSNSで読書チャレンジを主催するインテリジェンスの持ち主。試合前にはAC/DCやレッド・ツェッペリンなどのクラシック・ロックを聴いて集中を高める。"
                }
            ],
            "videos": [
                {
                    "title": "イガ・シフィオンテク クレーコートでの完璧なスライド＆トップスピン集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Iga+Swiatek+Roland+Garros+best+points"
                }
            ]
        },
        "coco-gauff": {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Coco_Gauff_2023.jpg/480px-Coco_Gauff_2023.jpg",
            "sns": {
                "instagram": "https://www.instagram.com/cocogauff/",
                "twitter": "https://x.com/CocoGauff"
            },
            "stories": [
                {
                    "title": "15歳でヴィーナスを倒した少女：セレナの後継者が築く新時代",
                    "source": "US Open 公式",
                    "url": "https://www.usopen.org/en_US/news/articles/2023-09-09/coco_gauff_wins_2023_us_open.html",
                    "summary": "アスリート一家に生まれ、15歳でウィンブルドン予選を突破し憧れのヴィーナス・ウィリアムズを破る衝撃デビュー。高い精神的成熟度を持ち、社会正義にも率先して声を上げるアメリカの若きリーダー。"
                }
            ],
            "videos": [
                {
                    "title": "ココ・ガウフ 2023年全米オープン初優勝の瞬間＆スーパーラリー",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Coco+Gauff+US+Open+championship+highlights"
                }
            ]
        },
        "moyuka-uchijima": {
            "imageUrl": "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=600&auto=format&fit=crop&q=80",
            "sns": {
                "instagram": "https://www.instagram.com/moyuka_uchijima/"
            },
            "stories": [
                {
                    "title": "マレーシア育ちの大型エース：トップ100突破と五輪代表への飛躍",
                    "source": "THE DIGEST",
                    "url": "https://thedigestweb.com/tennis/detail/id=81234",
                    "summary": "日本人の父とマレーシア人の母を持ち、幼少期をマレーシアで過ごす。178cmの恵まれた体格から放つ強烈なサーブを武器に、2024年にWTAツアーで破竹の快進撃を見せ日本女子No.1へ上り詰めた。"
                }
            ],
            "videos": [
                {
                    "title": "内島萌夏 全仏オープン＆ITF3週連続優勝ハイライト",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Moyuka+Uchijima+tennis+highlights"
                }
            ]
        },
        "shuko-aoyama": {
            "imageUrl": "https://images.unsplash.com/photo-1530915534664-4ac642379740?w=600&auto=format&fit=crop&q=80",
            "sns": {
                "instagram": "https://www.instagram.com/shukoaoyama/"
            },
            "stories": [
                {
                    "title": "身長154cmの電光石火ボレー：世界を唸らせるダブルスの匠",
                    "source": "Number Web",
                    "url": "https://number.bunshun.jp/articles/-/856214",
                    "summary": "早稲田大学出身。ツアー選手の中で極めて小柄ながら、卓越したポジション取りとポーチボレーの鋭さでツアー通算20勝を達成。全豪準優勝など世界のトップで戦い続ける。"
                }
            ],
            "videos": [
                {
                    "title": "青山修子＆柴原瑛菜 神がかり的コンビネーション＆スーパーボレー集",
                    "platform": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=Shuko+Aoyama+Ena+Shibahara+doubles"
                }
            ]
        }
    }

    # 各JSONファイルをロードしてマージ
    files = [
        "players_atp_singles.json",
        "players_wta_singles.json",
        "players_wheelchair.json",
        "players_atp_doubles.json",
        "players_wta_doubles.json"
    ]

    for fname in files:
        fpath = os.path.join(data_dir, fname)
        if not os.path.exists(fpath):
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            players = json.load(f)

        for p in players:
            pid = p.get("id")
            # プレースホルダー画像（初期値）
            if not p.get("imageUrl"):
                # イニシャルアバターまたはデフォルト
                p["imageUrl"] = ""
            if not p.get("sns"):
                p["sns"] = {}
            if not p.get("stories"):
                p["stories"] = []
            if not p.get("videos"):
                # 一般的なYouTube検索リンクを自動生成
                encoded_name = p.get("name", "").replace(" ", "+")
                p["videos"] = [
                    {
                        "title": f"{p.get('nameJa', p.get('name'))} プレー映像・ハイライト",
                        "platform": "YouTube",
                        "url": f"https://www.youtube.com/results?search_query={encoded_name}+tennis+highlights"
                    }
                ]

            # enrich_mapに対象選手があれば上書きマージ
            if pid in enrich_map:
                entry = enrich_map[pid]
                if "imageUrl" in entry:
                    p["imageUrl"] = entry["imageUrl"]
                if "sns" in entry:
                    p["sns"] = entry["sns"]
                if "stories" in entry:
                    p["stories"] = entry["stories"]
                if "videos" in entry:
                    p["videos"] = entry["videos"]

        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(players, f, ensure_ascii=False, indent=2)
        print(f"Updated {fname} successfully.")

if __name__ == "__main__":
    enrich_data()
