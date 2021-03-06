import json
from datetime import date
from openpyxl import load_workbook

tokyo_id_table = {
    13101: '千代田区',
    13102: '中央区',
    13103: '港区',
    13104: '新宿区',
    13105: '文京区',
    13106: '台東区',
    13107: '墨田区',
    13108: '江東区',
    13109: '品川区',
    13110: '目黒区',
    13111: '大田区',
    13112: '世田谷区',
    13113: '渋谷区',
    13114: '中野区',
    13115: '杉並区',
    13116: '豊島区',
    13117: '北区',
    13118: '荒川区',
    13119: '板橋区',
    13120: '練馬区',
    13121: '足立区',
    13122: '葛飾区',
    13123: '江戸川区',
    13201: '八王子市',
    13202: '立川市',
    13203: '武蔵野市',
    13204: '三鷹市',
    13205: '青梅市',
    13206: '府中市',
    13207: '昭島市',
    13208: '調布市',
    13209: '町田市',
    13210: '小金井市',
    13211: '小平市',
    13212: '日野市',
    13213: '東村山市',
    13214: '国分寺市',
    13215: '国立市',
    13218: '福生市',
    13219: '狛江市',
    13220: '東大和市',
    13221: '清瀬市',
    13222: '東久留米市',
    13223: '武蔵村山市',
    13224: '多摩市',
    13225: '稲城市',
    13227: '羽村市',
    13228: 'あきる野市',
    13229: '西東京市',
    13303: '瑞穂町',
    13305: '日の出町',
    13307: '檜原村',
    13308: '奥多摩町',
    13361: '大島町',
    13362: '利島村',
    13363: '新島村',
    13364: '神津島村',
    13381: '三宅村',
    13382: '御蔵島村',
    13401: '八丈町',
    13402: '青ヶ島村',
    13421: '小笠原村',
}
r_tokyo_id_table = {v: k for k, v in tokyo_id_table.items()}


def convert_ypopulation_log(infile):
    wb = load_workbook(filename=infile)
    logs = {}
    for ws in wb.worksheets:
        cities = []
        datetimes = []
        categories = {}
        for i, row in enumerate(ws.rows):
            values = [cell.value for cell in row]
            if i == 0:
                datetimes = values[2:]
            else:
                city = values[0]
                cities.append(city)
                category = values[1]
                if category not in categories:
                    categories[category] = []
                categories[category].append(values[2:])
        cities = list(filter(lambda x: x is not None, cities))
        datetimes = [
            date.fromordinal(x+date(1899, 12, 30).toordinal())
            for x in datetimes]
        for c, values in categories.items():
            for city, rows in zip(cities, values):
                try:
                    city_id = r_tokyo_id_table[city]
                except:
                    continue
                if city_id not in logs:
                    logs[city_id] = {
                        'id': city_id,
                        'name': city,
                        'value': {
                            'date': [],
                        },
                    }
                if c not in logs[city_id]['value']:
                    logs[city_id]['value'][c] = []
                logs[city_id]['value'][c] += rows
        for city, rows in zip(cities, values):
            try:
                city_id = r_tokyo_id_table[city]
            except:
                continue
            logs[city_id]['value']['date'] += [
                x.strftime('%Y/%m/%d') for x in datetimes]

    return logs


logs = convert_ypopulation_log('../data/東京23区推移0403.xlsx')

with open('../dist/tokyo_population_log.json', 'w') as f:
    json.dump(logs, f, ensure_ascii=False, indent=2)
