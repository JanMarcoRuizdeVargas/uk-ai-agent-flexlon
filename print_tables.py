import json
import pandas as pd

def search():
    with open('json/search.json') as f:
        data = json.load(f)

    item_rows = []
    offer_rows = []
    for catalog in data['message']['catalogs']:
        for item in catalog['beckn:items']:
            attrs = item['beckn:itemAttributes']
            tw = attrs['beckn:timeWindow']
            cp = attrs['beckn:capacityParameters']
            gp = attrs['beckn:gridParameters']
            item_rows.append({
                'id': item['beckn:id'],
                'availableCapacity': cp['availableCapacity'],
                'capacityUnit': cp['capacityUnit'],
                'start': tw['start'],
                'end': tw['end'],
                'duration': tw['duration'],
                'renewableMix': gp['renewableMix'],
                'carbonIntensity': gp['carbonIntensity']
            })
        for offer in catalog['beckn:offers']:
            pr = offer['beckn:price']
            offer_rows.append({
                'id': offer['beckn:id'],
                'price': pr['value'],
                'currency': pr['currency'],
            })

    pd.DataFrame(item_rows).to_csv('tables/search_item.csv', index=False)
    pd.DataFrame(offer_rows).to_csv('tables/search_offer.csv', index=False)

def select():
    with open('json/select.json') as f:
        data = json.load(f)

    order = data['message']['order']
    rows = []
    for item in order['beckn:orderItems']:
        attrs = item['beckn:orderItemAttributes']
        tw = attrs['beckn:timeWindow']
        cp = attrs['beckn:capacityParameters']
        rows.append({
            'slotId': attrs['beckn:slotId'],
            'availableCapacity': cp['availableCapacity'],
            'capacityUnit': cp['capacityUnit'],
            'start': tw['start'],
            'end': tw['end'],
            'duration': tw['duration']
        })

    pd.DataFrame(rows).to_csv('tables/select.csv', index=False)


def init():
    with open('json/init.json') as f:
        data = json.load(f)

    order = data['message']['order']
    rows = []
    for item in order['beckn:orderItems']:
        attrs = item['beckn:orderItemAttributes']
        tw = attrs['beckn:timeWindow']
        cp = attrs['beckn:capacityParameters']
        rows.append({
            'slotId': attrs['beckn:slotId'],
            'availableCapacity': cp['availableCapacity'],
            'capacityUnit': cp['capacityUnit'],
            'start': tw['start'],
            'end': tw['end'],
            'duration': tw['duration']
        })

    pd.DataFrame(rows).to_csv('tables/init.csv', index=False)

# search()
# select()
init()