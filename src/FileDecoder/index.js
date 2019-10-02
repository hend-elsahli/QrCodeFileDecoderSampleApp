import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Button,
  ActivityIndicator,
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import QrCodeReader from 'qrcode-reader';

const QR_CODE_FILE_URI = 'https://i.imgur.com/FYS11mW.png';

/*---------------------------------
            STYLES
---------------------------------*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/*---------------------------------
            COMPONENT
---------------------------------*/
class FileDecoder extends React.Component {
  state = {
    loading: true,
    decoding: false,
    qrCodeFileUri: QR_CODE_FILE_URI,
    fileError: '',
    decodingError: '',
    width: '',
    height: '',
    base64: '',
    decodingResult: '',
  };

  async componentDidMount() {
    const { qrCodeFileUri } = this.state;
    const { base64, fileError } = await this.loadImageData(qrCodeFileUri);

    if (fileError) return this.setState({ fileError, loading: false });
    Image.getSize(qrCodeFileUri, (width, height) => {
      this.setState({ base64, width, height, loading: false });
    });
  }

  loadImageData = async uri => {
    const result = {};
    const { fs } = RNFetchBlob;

    try {
      const res = await RNFetchBlob.config({
        fileCache: true,
      }).fetch('GET', uri);
      result.base64 = await res.readFile('base64');
      const imageLocalFilePath = await res.path();
      fs.unlink(imageLocalFilePath);
    } catch (error) {
      result.fileError = `Error getting image base64: ${error}`;
    }

    return result;
  };

  getImageSize = uri =>
    Image.getSize(uri, (width, height) => ({ width, height }));

  decodeFile = async () => {
    this.setState({ decoding: true });

    const { width, height, base64 } = this.state;
    /* eslint-disable-next-line */
    const PngParse = require('../modules/PngParse');
    const buffer = Buffer.from(base64, 'base64');
    PngParse.parseBuffer(buffer, (err, imageData) => {
      if (err) return this.setState({ decodingError: err });

      const qr = new QrCodeReader();
      qr.callback = (error, res) => {
        if (error || !res) {
          this.setState({
            decodingError: error,
            decodingResult: '',
            decoding: false,
          });
        } else {
          this.setState({
            decodingError: '',
            decodingResult: res.result,
            decoding: false,
          });
        }
      };
      qr.decode({ width, height }, imageData.data);
    });
  };

  render() {
    const {
      loading,
      decoding,
      qrCodeFileUri,
      fileError,
      decodingError,
      width,
      height,
      decodingResult,
    } = this.state;

    if (fileError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>unable to load file</Text>
          <Text style={styles.error}>{fileError}</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Image source={{ uri: qrCodeFileUri }} style={{ width, height }} />
        <View style={{ marginVertical: 8 }}>
          <Button
            disabled={decoding}
            title="Decode File"
            onPress={this.decodeFile}
          />
        </View>

        {decodingResult ? (
          <View style={styles.center}>
            <View style={{ marginBottom: 4 }}>
              <Text style={styles.title}>Decoding Result</Text>
            </View>
            <Text>{decodingResult}</Text>
            <Text style={styles.error}>{decodingError}</Text>
          </View>
        ) : null}
      </View>
    );
  }
}

export default FileDecoder;
