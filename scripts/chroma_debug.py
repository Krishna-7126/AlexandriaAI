import chromadb
client=chromadb.PersistentClient(path='./chroma_db')
try:
    coll=client.get_collection('transcripts')
    res=coll.get()
    print('ids',len(res.get('ids',[])))
    print('metadatas',len(res.get('metadatas',[])))
    print('first_meta',res.get('metadatas',[])[:3])
except Exception as e:
    print('err', e)
