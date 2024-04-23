import os

# 指定要操作的目录
directory = '/home/comcat/download/zent/onchain/contracts/borrow/mocks'

# 遍历目录中的文件
for filename in os.listdir(directory):
    # if filename.isupper():
        # 构造新的小写文件名
    new_filename = filename.lower()
    # 重命名文件
    os.rename(os.path.join(directory, filename), os.path.join(directory, new_filename))