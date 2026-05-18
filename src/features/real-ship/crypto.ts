import * as JSEncryptModule from './vendor/jsencrypt.min.js';

const LOGIN_PUBLIC_KEY =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkWELqNArt9/Y4QbrlBO4SALfHlic1+DZokZwlhLjOPlLnuKJoDqdX4z82hwdHJ93ZXhWYhsTdNPY+ZJQD+c9uQyQxbGHIQVSsSbNiSp71aCA/pRVtxV8R+2FFvbeTqZUnaa6Y938iyYkVlzYQke7+2cfmpLbLh2+8yQWBBIhC1wIDAQAB';

export const encryptPassword = async (plainText: string) => {
  const JSEncrypt =
    (JSEncryptModule as { default?: new () => { setPublicKey: (key: string) => void; encrypt: (value: string) => string | false } }).default ||
    (window as Window & {
      JSEncrypt?: new () => {
        setPublicKey: (key: string) => void;
        encrypt: (value: string) => string | false;
      };
    }).JSEncrypt;

  if (!JSEncrypt) {
    throw new Error('未能加载 JSEncrypt，无法完成静默登录。');
  }

  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(LOGIN_PUBLIC_KEY);

  const encrypted = encryptor.encrypt(plainText);
  if (!encrypted) {
    throw new Error('密码加密失败，无法完成静默登录。');
  }

  return encrypted;
};
