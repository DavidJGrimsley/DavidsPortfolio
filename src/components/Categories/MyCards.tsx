import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import pieces from '@json/pieces.json';
import { router, Href } from 'expo-router';
import { Pieces, normalizePieces } from '@/types/portfolio';

const piecesData: Pieces = normalizePieces(pieces);

type MyCardsProps = {
    pageCategory: string;
};

export function MyCards({ pageCategory }: MyCardsProps) {
    const [data, setData] = React.useState<React.ReactElement<any, any>[]>([]);

    React.useEffect(() => {
        const newData: React.ReactElement<any, any>[] = [];
        
        Object.keys(piecesData).forEach((category) => {
            if (category === pageCategory) {
                piecesData[category].forEach((element) => {
                    const card = (
                        <Col key={element.title} className="w-full items-center">
                            <Card className="m-[2%] w-[90%] max-w-200" style={{} as React.CSSProperties}>
                                <Card.Img variant="top" src={element.gif} />
                                <Card.Body>
                                    <Card.Title>{element.displayTitle || element.title}</Card.Title>
                                    <Card.Text>{element.caption}</Card.Text>
                                    <Button variant="primary" onClick={() => router.push(`/${pageCategory}/${element.title}` as any)}>
                                        View details
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                    newData.push(card);
                });
            }
        });
        
        setData(newData);
    }, [pageCategory]);
    
    return (
        <Container className="flex flex-wrap justify-center items-center">
            <Row className="items-center flex-row flex-wrap w-full">
                {data}
            </Row>
        </Container>
    );    
}
