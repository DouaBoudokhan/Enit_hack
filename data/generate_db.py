"""Generate the influencers_scraped.json seed database."""
import json, pathlib

DATA = [
  {
    "name": "Oumaima Hamrouni",
    "handle": "oumaima.hamrouni_",
    "category": "Lifestyle",
    "profile_url": "https://www.instagram.com/oumaima.hamrouni_/",
    "tiktok_url": "https://www.tiktok.com/@oumaima.hamrouni",
    "image_url": "",
    "follower_count": 662600,
    "bio": "Lifestyle & feel-good content 🇹🇳✨ Sharing my daily life, fashion tips & positive vibes from Tunisia",
    "posts": [
      {
        "post_id": "OH_post_1", "post_url": "https://www.instagram.com/p/OH_post_1/",
        "media_type": "video", "likes_count": 34200, "comments_count": 487,
        "enriched_content": "Reel montrant une journée à Sidi Bou Said avec une tenue estivale colorée. Visual description: [Reel] Young woman walking through iconic blue-and-white streets of Sidi Bou Said in a flowing orange dress.",
        "comments": [
          {"id":"c1","text":"ما شاء الله عليك يا أميمة 😍❤️","ownerUsername":"mariem_ben","timestamp":"2026-04-28T10:00:00","repliesCount":2,"likesCount":45,"owner":{"is_private":False,"is_verified":False,"username":"mariem_ben"},"sentiment":"positive","language":"Arabic","quality_score":8},
          {"id":"c2","text":"Sidi bou said 💙 trop belle","ownerUsername":"yasmine.tn","timestamp":"2026-04-28T10:15:00","repliesCount":0,"likesCount":23,"owner":{"is_private":False,"is_verified":False,"username":"yasmine.tn"},"sentiment":"positive","language":"French","quality_score":7},
          {"id":"c3","text":"winek bech tetla3 content jdid?","ownerUsername":"ahmed_gamer","timestamp":"2026-04-28T11:00:00","repliesCount":1,"likesCount":5,"owner":{"is_private":False,"is_verified":False,"username":"ahmed_gamer"},"sentiment":"neutral","language":"Darija","quality_score":5},
          {"id":"c4","text":"❤️❤️❤️🔥🔥","ownerUsername":"nour_style","timestamp":"2026-04-28T11:30:00","repliesCount":0,"likesCount":12,"owner":{"is_private":False,"is_verified":False,"username":"nour_style"},"sentiment":"positive","language":"emoji_only","quality_score":6},
          {"id":"c5","text":"تصوير رائع والله! أحسن واحدة 🙌","ownerUsername":"rania_tunis","timestamp":"2026-04-28T12:00:00","repliesCount":3,"likesCount":67,"owner":{"is_private":False,"is_verified":True,"username":"rania_tunis"},"sentiment":"positive","language":"Arabic","quality_score":9}
        ]
      },
      {
        "post_id": "OH_post_2", "post_url": "https://www.instagram.com/p/OH_post_2/",
        "media_type": "image", "likes_count": 21500, "comments_count": 312,
        "enriched_content": "Photo d'un nouveau look maquillage naturel avec produits tunisiens. Visual description: Close-up beauty shot of woman with natural glowing makeup, holding local Tunisian skincare product.",
        "comments": [
          {"id":"c6","text":"كيفاش تعملي هالمكياج؟ 😍 بالله عطينا تيتوريال","ownerUsername":"salma_beauty","timestamp":"2026-04-25T09:00:00","repliesCount":5,"likesCount":89,"owner":{"is_private":False,"is_verified":False,"username":"salma_beauty"},"sentiment":"positive","language":"Darija","quality_score":9},
          {"id":"c7","text":"Produit tunisien 🇹🇳 j'adore le concept","ownerUsername":"ines_dz","timestamp":"2026-04-25T09:30:00","repliesCount":1,"likesCount":34,"owner":{"is_private":False,"is_verified":False,"username":"ines_dz"},"sentiment":"positive","language":"French","quality_score":8},
          {"id":"c8","text":"fake look lol","ownerUsername":"troll_account99","timestamp":"2026-04-25T10:00:00","repliesCount":0,"likesCount":0,"owner":{"is_private":True,"is_verified":False,"username":"troll_account99"},"sentiment":"negative","language":"English","quality_score":1},
          {"id":"c9","text":"انشالله بالسعد والهناء يا قلبي 💕","ownerUsername":"mama_oumaima","timestamp":"2026-04-25T11:00:00","repliesCount":1,"likesCount":56,"owner":{"is_private":False,"is_verified":False,"username":"mama_oumaima"},"sentiment":"positive","language":"Darija","quality_score":8},
          {"id":"c10","text":"gorgeous!! where can I buy this?","ownerUsername":"sophie_paris","timestamp":"2026-04-25T12:00:00","repliesCount":2,"likesCount":18,"owner":{"is_private":False,"is_verified":False,"username":"sophie_paris"},"sentiment":"positive","language":"English","quality_score":7}
        ]
      },
      {
        "post_id": "OH_post_3", "post_url": "https://www.instagram.com/p/OH_post_3/",
        "media_type": "video", "likes_count": 41300, "comments_count": 623,
        "enriched_content": "Reel humoristique sur les clichés de la vie tunisienne avec transitions créatives. Visual description: [Reel] Fast-paced comedy reel with creative outfit transitions showing stereotypical Tunisian daily life situations.",
        "comments": [
          {"id":"c11","text":"هههههه موت بالضحك 🤣🤣","ownerUsername":"khaled_sfax","timestamp":"2026-04-20T14:00:00","repliesCount":4,"likesCount":112,"owner":{"is_private":False,"is_verified":False,"username":"khaled_sfax"},"sentiment":"positive","language":"Darija","quality_score":8},
          {"id":"c12","text":"trop vrai 😂😂 c'est exactement ça","ownerUsername":"lina_beaute","timestamp":"2026-04-20T14:30:00","repliesCount":2,"likesCount":78,"owner":{"is_private":False,"is_verified":False,"username":"lina_beaute"},"sentiment":"positive","language":"French","quality_score":8},
          {"id":"c13","text":"مين يحب تونس يعمل لايك ❤️","ownerUsername":"bot_spammer","timestamp":"2026-04-20T15:00:00","repliesCount":0,"likesCount":1,"owner":{"is_private":True,"is_verified":False,"username":"bot_spammer"},"sentiment":"neutral","language":"Arabic","quality_score":2,"toxicity_flag":True},
          {"id":"c14","text":"نحبك برشا أميمة 💯🙏","ownerUsername":"amira_sousse","timestamp":"2026-04-20T16:00:00","repliesCount":1,"likesCount":45,"owner":{"is_private":False,"is_verified":False,"username":"amira_sousse"},"sentiment":"positive","language":"Darija","quality_score":7},
          {"id":"c15","text":"أحسن كونتنت تونسي والله 👏","ownerUsername":"youssef_creator","timestamp":"2026-04-20T17:00:00","repliesCount":3,"likesCount":91,"owner":{"is_private":False,"is_verified":True,"username":"youssef_creator"},"sentiment":"positive","language":"Darija","quality_score":9}
        ]
      },
      {
        "post_id": "OH_post_4", "post_url": "https://www.instagram.com/p/OH_post_4/",
        "media_type": "image", "likes_count": 18700, "comments_count": 245,
        "enriched_content": "Photo mode avec outfit casual chic en plein Tunis centre-ville. Visual description: Full-body fashion shot of woman in casual chic outfit standing on Avenue Habib Bourguiba, Tunis.",
        "comments": [
          {"id":"c16","text":"le style 🔥🔥 où t'as acheté la veste?","ownerUsername":"mode_tn","timestamp":"2026-04-15T08:00:00","repliesCount":3,"likesCount":67,"owner":{"is_private":False,"is_verified":False,"username":"mode_tn"},"sentiment":"positive","language":"French","quality_score":8},
          {"id":"c17","text":"Avenue Bourguiba ❤️ toujours aussi belle","ownerUsername":"hajer_ben","timestamp":"2026-04-15T09:00:00","repliesCount":0,"likesCount":29,"owner":{"is_private":False,"is_verified":False,"username":"hajer_ben"},"sentiment":"positive","language":"French","quality_score":7},
          {"id":"c18","text":"meh nothing special","ownerUsername":"random_hater","timestamp":"2026-04-15T10:00:00","repliesCount":1,"likesCount":2,"owner":{"is_private":False,"is_verified":False,"username":"random_hater"},"sentiment":"negative","language":"English","quality_score":2},
          {"id":"c19","text":"ربي يحفظك 🤲","ownerUsername":"fatma_tn","timestamp":"2026-04-15T11:00:00","repliesCount":0,"likesCount":34,"owner":{"is_private":False,"is_verified":False,"username":"fatma_tn"},"sentiment":"positive","language":"Darija","quality_score":7}
        ]
      },
      {
        "post_id": "OH_post_5", "post_url": "https://www.instagram.com/p/OH_post_5/",
        "media_type": "video", "likes_count": 52100, "comments_count": 812,
        "enriched_content": "Reel Get Ready With Me pour un événement spécial avec maquillage et coiffure. Visual description: [Reel] Getting ready video showing full makeup and hair transformation for a special event, upbeat music.",
        "comments": [
          {"id":"c20","text":"transformation incroyable 😱💅","ownerUsername":"beauty_queen_tn","timestamp":"2026-04-10T18:00:00","repliesCount":6,"likesCount":134,"owner":{"is_private":False,"is_verified":False,"username":"beauty_queen_tn"},"sentiment":"positive","language":"French","quality_score":9},
          {"id":"c21","text":"يا لطيف شنوة الجمال هذا 😍😍😍","ownerUsername":"sara_nabeul","timestamp":"2026-04-10T18:30:00","repliesCount":2,"likesCount":89,"owner":{"is_private":False,"is_verified":False,"username":"sara_nabeul"},"sentiment":"positive","language":"Darija","quality_score":9},
          {"id":"c22","text":"queen behavior 👑","ownerUsername":"zeineb_style","timestamp":"2026-04-10T19:00:00","repliesCount":1,"likesCount":56,"owner":{"is_private":False,"is_verified":False,"username":"zeineb_style"},"sentiment":"positive","language":"English","quality_score":7},
          {"id":"c23","text":"🔥🔥🔥","ownerUsername":"fans_oumaima","timestamp":"2026-04-10T19:30:00","repliesCount":0,"likesCount":23,"owner":{"is_private":False,"is_verified":False,"username":"fans_oumaima"},"sentiment":"positive","language":"emoji_only","quality_score":5},
          {"id":"c24","text":"بالله شنوة المكياج اللي تستعمل فيه؟ نحب نشري كيفو","ownerUsername":"houda_ariana","timestamp":"2026-04-10T20:00:00","repliesCount":4,"likesCount":72,"owner":{"is_private":False,"is_verified":False,"username":"houda_ariana"},"sentiment":"positive","language":"Darija","quality_score":8}
        ]
      }
    ]
  },
  {
    "name": "Samira Magroun",
    "handle": "samiramagroun",
    "category": "Actress & TV Personality",
    "profile_url": "https://www.instagram.com/samiramagroun/",
    "tiktok_url": "https://www.tiktok.com/@samiramagroun",
    "image_url": "",
    "follower_count": 2100000,
    "bio": "Actrice tunisienne 🎭 | Maktoub, Garage Lekrik, El Foundou | 🇹🇳 Life, fashion & behind the scenes",
    "posts": [
      {
        "post_id": "SM_post_1", "post_url": "https://www.instagram.com/p/SM_post_1/",
        "media_type": "video", "likes_count": 87600, "comments_count": 1245,
        "enriched_content": "Behind the scenes du tournage de la nouvelle saison de Maktoub. Visual description: [Reel] Behind-the-scenes footage from TV set showing actress in costume between takes, laughing with crew.",
        "comments": [
          {"id":"s1","text":"نستناو في الموسم الجديد بفارغ الصبر 😍","ownerUsername":"fan_maktoub","timestamp":"2026-04-27T10:00:00","repliesCount":8,"likesCount":234,"owner":{"is_private":False,"is_verified":False,"username":"fan_maktoub"},"sentiment":"positive","language":"Arabic","quality_score":9},
          {"id":"s2","text":"Samira tu es la meilleure actrice tunisienne ❤️","ownerUsername":"cinema_tn","timestamp":"2026-04-27T10:30:00","repliesCount":3,"likesCount":156,"owner":{"is_private":False,"is_verified":True,"username":"cinema_tn"},"sentiment":"positive","language":"French","quality_score":9},
          {"id":"s3","text":"الممثلة نمبر وان 🏆","ownerUsername":"ali_gafsa","timestamp":"2026-04-27T11:00:00","repliesCount":1,"likesCount":89,"owner":{"is_private":False,"is_verified":False,"username":"ali_gafsa"},"sentiment":"positive","language":"Darija","quality_score":8},
          {"id":"s4","text":"overrated tbh","ownerUsername":"critic_anon","timestamp":"2026-04-27T12:00:00","repliesCount":5,"likesCount":3,"owner":{"is_private":False,"is_verified":False,"username":"critic_anon"},"sentiment":"negative","language":"English","quality_score":2},
          {"id":"s5","text":"ربي يوفقك يا سميرة 🤲❤️","ownerUsername":"amel_bizerte","timestamp":"2026-04-27T13:00:00","repliesCount":0,"likesCount":78,"owner":{"is_private":False,"is_verified":False,"username":"amel_bizerte"},"sentiment":"positive","language":"Darija","quality_score":8}
        ]
      },
      {
        "post_id": "SM_post_2", "post_url": "https://www.instagram.com/p/SM_post_2/",
        "media_type": "image", "likes_count": 65400, "comments_count": 890,
        "enriched_content": "Photo glamour au Festival de Carthage avec une robe de créateur tunisien. Visual description: Red carpet photo of actress in elegant designer gown at Carthage International Festival amphitheatre.",
        "comments": [
          {"id":"s6","text":"الأناقة بعينها 👗✨ فستان خيالي","ownerUsername":"fashion_arab","timestamp":"2026-04-22T20:00:00","repliesCount":4,"likesCount":198,"owner":{"is_private":False,"is_verified":False,"username":"fashion_arab"},"sentiment":"positive","language":"Arabic","quality_score":9},
          {"id":"s7","text":"magnifique comme toujours 💫","ownerUsername":"julie_france","timestamp":"2026-04-22T20:30:00","repliesCount":1,"likesCount":67,"owner":{"is_private":False,"is_verified":False,"username":"julie_france"},"sentiment":"positive","language":"French","quality_score":7},
          {"id":"s8","text":"follow me follow me follow me","ownerUsername":"spam_bot_22","timestamp":"2026-04-22T21:00:00","repliesCount":0,"likesCount":0,"owner":{"is_private":True,"is_verified":False,"username":"spam_bot_22"},"sentiment":"neutral","language":"English","quality_score":1,"toxicity_flag":True},
          {"id":"s9","text":"قرطاج 🇹🇳 وسميرة = كومبو مثالي","ownerUsername":"nabil_tunis","timestamp":"2026-04-22T22:00:00","repliesCount":2,"likesCount":112,"owner":{"is_private":False,"is_verified":False,"username":"nabil_tunis"},"sentiment":"positive","language":"Darija","quality_score":8},
          {"id":"s10","text":"شكون المصمم اللي عمل الفستان؟","ownerUsername":"designer_fan","timestamp":"2026-04-22T22:30:00","repliesCount":3,"likesCount":45,"owner":{"is_private":False,"is_verified":False,"username":"designer_fan"},"sentiment":"neutral","language":"Darija","quality_score":6}
        ]
      },
      {
        "post_id": "SM_post_3", "post_url": "https://www.instagram.com/p/SM_post_3/",
        "media_type": "video", "likes_count": 112000, "comments_count": 1890,
        "enriched_content": "Reel comique recréant une scène culte de Maktoub avec un twist moderne. Visual description: [Reel] Comedic recreation of iconic TV scene with modern twist, actress in split screen comparing old vs new character.",
        "comments": [
          {"id":"s11","text":"هههه هذي سميرة اللي نحبوها 🤣🤣🤣","ownerUsername":"comedy_fan_tn","timestamp":"2026-04-18T15:00:00","repliesCount":7,"likesCount":345,"owner":{"is_private":False,"is_verified":False,"username":"comedy_fan_tn"},"sentiment":"positive","language":"Darija","quality_score":9},
          {"id":"s12","text":"la scène du thé 😂😂 je m'en souviens trop","ownerUsername":"nostalgie_tv","timestamp":"2026-04-18T15:30:00","repliesCount":3,"likesCount":178,"owner":{"is_private":False,"is_verified":False,"username":"nostalgie_tv"},"sentiment":"positive","language":"French","quality_score":8},
          {"id":"s13","text":"بصراحة التمثيل تاعها ولا أحسن ممثلة عربية","ownerUsername":"dz_viewer","timestamp":"2026-04-18T16:00:00","repliesCount":2,"likesCount":134,"owner":{"is_private":False,"is_verified":False,"username":"dz_viewer"},"sentiment":"positive","language":"mixed","quality_score":8},
          {"id":"s14","text":"مسلسل مكتوب أحسن مسلسل تونسي 🏅","ownerUsername":"series_tn","timestamp":"2026-04-18T17:00:00","repliesCount":4,"likesCount":201,"owner":{"is_private":False,"is_verified":True,"username":"series_tn"},"sentiment":"positive","language":"Darija","quality_score":9},
          {"id":"s15","text":"الفن التونسي 🇹🇳 يستاهل عالمي","ownerUsername":"culture_maghreb","timestamp":"2026-04-18T18:00:00","repliesCount":1,"likesCount":89,"owner":{"is_private":False,"is_verified":False,"username":"culture_maghreb"},"sentiment":"positive","language":"Arabic","quality_score":8}
        ]
      },
      {
        "post_id": "SM_post_4", "post_url": "https://www.instagram.com/p/SM_post_4/",
        "media_type": "image", "likes_count": 54300, "comments_count": 678,
        "enriched_content": "Photo en famille célébrant l'Aïd avec une tenue traditionnelle. Visual description: Family photo in traditional Tunisian clothing during Eid celebration, warm indoor setting with decorations.",
        "comments": [
          {"id":"s16","text":"عيد مبارك سعيد يا سميرة وعائلتك 🌙❤️","ownerUsername":"eid_greetings","timestamp":"2026-04-12T08:00:00","repliesCount":2,"likesCount":234,"owner":{"is_private":False,"is_verified":False,"username":"eid_greetings"},"sentiment":"positive","language":"Arabic","quality_score":8},
          {"id":"s17","text":"la famille c'est tout 💕 joyeuse fête","ownerUsername":"famille_first","timestamp":"2026-04-12T09:00:00","repliesCount":0,"likesCount":56,"owner":{"is_private":False,"is_verified":False,"username":"famille_first"},"sentiment":"positive","language":"French","quality_score":7},
          {"id":"s18","text":"بالعافية والسعادة على الجميع 🤲","ownerUsername":"oum_mohamed","timestamp":"2026-04-12T10:00:00","repliesCount":1,"likesCount":89,"owner":{"is_private":False,"is_verified":False,"username":"oum_mohamed"},"sentiment":"positive","language":"Darija","quality_score":8},
          {"id":"s19","text":"cette femme ne sait pas agir, juste du buzz","ownerUsername":"neg_critic_44","timestamp":"2026-04-12T11:00:00","repliesCount":6,"likesCount":4,"owner":{"is_private":False,"is_verified":False,"username":"neg_critic_44"},"sentiment":"negative","language":"French","quality_score":2}
        ]
      },
      {
        "post_id": "SM_post_5", "post_url": "https://www.instagram.com/p/SM_post_5/",
        "media_type": "video", "likes_count": 95800, "comments_count": 1567,
        "enriched_content": "Reel de collaboration avec une marque de cosmétiques tunisienne, montrant la routine beauté. Visual description: [Reel] Product placement beauty routine video featuring local Tunisian cosmetics brand, soft lighting studio setup.",
        "comments": [
          {"id":"s20","text":"أخيرا كولاب مع ماركة تونسية 🇹🇳👏","ownerUsername":"beauty_tn_fan","timestamp":"2026-04-05T16:00:00","repliesCount":5,"likesCount":267,"owner":{"is_private":False,"is_verified":False,"username":"beauty_tn_fan"},"sentiment":"positive","language":"Darija","quality_score":9},
          {"id":"s21","text":"j'ai commandé le produit grâce à toi Samira 💄","ownerUsername":"client_fidele","timestamp":"2026-04-05T17:00:00","repliesCount":2,"likesCount":145,"owner":{"is_private":False,"is_verified":False,"username":"client_fidele"},"sentiment":"positive","language":"French","quality_score":9},
          {"id":"s22","text":"pub déguisée 🙄","ownerUsername":"cynique_viewer","timestamp":"2026-04-05T18:00:00","repliesCount":3,"likesCount":12,"owner":{"is_private":False,"is_verified":False,"username":"cynique_viewer"},"sentiment":"negative","language":"French","quality_score":3},
          {"id":"s23","text":"❤️❤️❤️❤️","ownerUsername":"fan_forever","timestamp":"2026-04-05T19:00:00","repliesCount":0,"likesCount":34,"owner":{"is_private":False,"is_verified":False,"username":"fan_forever"},"sentiment":"positive","language":"emoji_only","quality_score":5},
          {"id":"s24","text":"سميرة خير سفيرة للجمال التونسي 💎","ownerUsername":"tunisian_pride","timestamp":"2026-04-05T20:00:00","repliesCount":2,"likesCount":189,"owner":{"is_private":False,"is_verified":True,"username":"tunisian_pride"},"sentiment":"positive","language":"Darija","quality_score":9}
        ]
      }
    ]
  }
]

out = pathlib.Path(__file__).parent / "influencers_scraped.json"
out.write_text(json.dumps(DATA, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(DATA)} influencers to {out}")
