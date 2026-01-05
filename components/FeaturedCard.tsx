import React from 'react';
import { View, Dimensions } from 'react-native';
import { Button, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import pieces from '@/assets/json/pieces.json';
import { router, Href } from 'expo-router';
import { Pieces, normalizePieces } from '@/types/portfolio';

const piecesData: Pieces = normalizePieces(pieces);

export function FeaturedCard() {
    const [data, setData] = React.useState<React.ReactElement<any, any>[]>([]);
    const screenWidth = Dimensions.get('window').width;
    
    React.useEffect(() => {
        const newData: React.ReactElement<any, any>[] = [];
        
        Object.keys(piecesData).forEach((category) => {
            piecesData[category].forEach((element) => {
                if (element.isFeatured) {
                    const card = (
                        <Card key={element.title} style={{ width: screenWidth / 1.8 }}>
                            <Card.Img variant="top" src={element.gif} />
                            <Card.Body>
                                <Card.Title>{element.displayTitle || element.title}</Card.Title>
                                <Card.Text>{element.caption}</Card.Text>
                                <Button variant="primary" onClick={() => router.push(`/${category}/${element.title}` as any)}>
                                    View Details
                                </Button>
                            </Card.Body>
                        </Card>
                    );
                    newData.push(card);
                }
            });
        });
        
        setData(newData);
    }, [screenWidth]);
    
    return <View>{data}</View>;
}
